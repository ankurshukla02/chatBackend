import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Chat } from '../chats/chat.entity';
import { ChatMember } from '../chats/chat-member.entity';
import { InitialChatSchema1730000000000 } from './migrations/1730000000000-InitialChatSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'chatdb',
  entities: [User, Chat, ChatMember],
  migrations: [InitialChatSchema1730000000000],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
