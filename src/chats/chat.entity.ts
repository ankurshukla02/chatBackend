import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatMember } from './chat-member.entity';

@Entity('chats')
@Index('uq_chats_user_pair', ['userLowId', 'userHighId'], { unique: true })
@Check('ck_chats_user_pair_order', '"user_low_id" < "user_high_id"')
export class Chat {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'user_low_id', type: 'uuid' }) userLowId!: string;
  @Column({ name: 'user_high_id', type: 'uuid' }) userHighId!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
  @OneToMany(() => ChatMember, (member) => member.chat, { cascade: ['insert'] })
  members!: ChatMember[];
}
