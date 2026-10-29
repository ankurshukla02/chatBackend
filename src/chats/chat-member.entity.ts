import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Chat } from './chat.entity';

@Entity('chat_members')
@Index('idx_chat_members_user_id', ['userId'])
export class ChatMember {
  @PrimaryColumn({ name: 'chat_id', type: 'uuid' }) chatId!: string;
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
  @ManyToOne(() => Chat, (chat) => chat.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;
  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
