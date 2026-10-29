import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { Chat } from './chat.entity';
import { ChatMember } from './chat-member.entity';
import { User } from '../users/user.entity';
import { FIRESTORE } from '../config/firebase.provider';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat) private readonly chats: Repository<Chat>,
    @InjectRepository(ChatMember)
    private readonly members: Repository<ChatMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    @Inject(FIRESTORE) private readonly firestore: Firestore,
  ) {}

  async createOrGet(userAId: string, userBId: string, requesterId: string) {
    if (userAId === userBId)
      throw new BadRequestException('A 1:1 chat requires two different users');
    if (![userAId, userBId].includes(requesterId))
      throw new ForbiddenException(
        'You can only create a chat involving yourself',
      );
    const users = await this.users.findBy({ id: In([userAId, userBId]) });
    if (users.length !== 2)
      throw new NotFoundException('One or both users do not exist');
    const pair = [userAId, userBId].sort();
    const existing = await this.chats.findOne({
      where: { userLowId: pair[0], userHighId: pair[1] },
    });
    if (existing) return { chatId: existing.id, created: false };

    // The unique pair index is the concurrency-safe source of truth.
    try {
      const chatId = await this.dataSource.transaction(async (manager) => {
        const chat = await manager.save(
          Chat,
          manager.create(Chat, { userLowId: pair[0], userHighId: pair[1] }),
        );
        await manager.insert(ChatMember, [
          { chatId: chat.id, userId: pair[0] },
          { chatId: chat.id, userId: pair[1] },
        ]);
        return chat.id;
      });
      return { chatId, created: true };
    } catch (error) {
      // If a concurrent request won the unique-index race, return its chat.
      const winner = await this.chats.findOne({
        where: { userLowId: pair[0], userHighId: pair[1] },
      });
      if (winner) return { chatId: winner.id, created: false };
      throw error;
    }
  }

  async assertMember(chatId: string, userId: string) {
    const member = await this.members.findOne({ where: { chatId, userId } });
    if (!member)
      throw new ForbiddenException('You are not a member of this chat');
  }

  async listUserChats(userId: string) {
    const membership = await this.members.find({
      where: { userId },
      relations: { chat: { members: { user: true } } },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      membership.map(async (m) => {
        const chatMembers = m.chat.members.map((member) => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
        }));
        const lastMessage = await this.firestore
          .collection('chats')
          .doc(m.chatId)
          .collection('messages')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        return {
          chatId: m.chatId,
          members: chatMembers,
          createdAt: m.chat.createdAt,
          updatedAt: m.chat.updatedAt,
          lastMessage: lastMessage.empty ? null : lastMessage.docs[0].data(),
        };
      }),
    );
  }

  async sendMessage(chatId: string, senderId: string, text: string) {
    await this.assertMember(chatId, senderId);
    const ref = this.firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc();
    const message = {
      messageId: ref.id,
      chatId,
      senderId,
      text: text.trim(),
      createdAt: FieldValue.serverTimestamp(),
      readBy: { [senderId]: true },
    };
    await ref.set(message);
    await this.chats.update({ id: chatId }, { updatedAt: new Date() });
    const saved = await ref.get();
    return saved.data();
  }

  async getMessages(
    chatId: string,
    userId: string,
    limit: number,
    cursor?: string,
  ) {
    await this.assertMember(chatId, userId);
    let query = this.firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .orderBy('__name__')
      .limit(limit);
    if (cursor) {
      const cursorDoc = await this.firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc(cursor)
        .get();
      if (!cursorDoc.exists)
        throw new BadRequestException('Invalid pagination cursor');
      query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const messages = snapshot.docs.map((doc) => doc.data()).reverse();
    return {
      messages,
      nextCursor:
        snapshot.docs.length === limit
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null,
    };
  }

  async markRead(chatId: string, messageId: string, userId: string) {
    await this.assertMember(chatId, userId);
    const ref = this.firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundException('Message not found');
    await ref.update({ [`readBy.${userId}`]: true });
    return { chatId, messageId, userId, read: true };
  }

  async updateLastSeen(chatId: string, userId: string, messageId: string) {
    await this.assertMember(chatId, userId);
    const messageRef = this.firestore
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId);
    const message = await messageRef.get();
    if (!message.exists) throw new NotFoundException('Message not found');
    await this.firestore
      .collection('chats')
      .doc(chatId)
      .collection('lastSeen')
      .doc(userId)
      .set({ userId, messageId, updatedAt: FieldValue.serverTimestamp() });
    return { chatId, userId, messageId, updated: true };
  }
}
