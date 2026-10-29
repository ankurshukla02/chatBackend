import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './chat.entity';
import { ChatMember } from './chat-member.entity';
import { User } from '../users/user.entity';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { AuthModule } from '../auth/auth.module';
import { firestoreProvider } from '../config/firebase.provider';
@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMember, User]), AuthModule],
  controllers: [ChatsController],
  providers: [ChatsService, firestoreProvider],
})
export class ChatsModule {}
