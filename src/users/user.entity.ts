import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatMember } from '../chats/chat-member.entity';

@Entity('users')
@Index('uq_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'varchar', length: 255 }) email!: string;
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
  @OneToMany(() => ChatMember, (member) => member.user)
  memberships!: ChatMember[];
}
