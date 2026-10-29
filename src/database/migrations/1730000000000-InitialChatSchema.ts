import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialChatSchema1730000000000 implements MigrationInterface {
  name = 'InitialChatSchema1730000000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TABLE "users" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "name" varchar(120) NOT NULL,
      "email" varchar(255) NOT NULL,
      "password_hash" varchar(255) NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_users_id" PRIMARY KEY ("id"),
      CONSTRAINT "uq_users_email" UNIQUE ("email")
    )`);
    await queryRunner.query(`CREATE TABLE "chats" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "user_low_id" uuid NOT NULL,
      "user_high_id" uuid NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_chats_id" PRIMARY KEY ("id"),
      CONSTRAINT "uq_chats_user_pair" UNIQUE ("user_low_id", "user_high_id"),
      CONSTRAINT "ck_chats_user_pair_order" CHECK ("user_low_id" < "user_high_id"),
      CONSTRAINT "fk_chats_user_low" FOREIGN KEY ("user_low_id") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "fk_chats_user_high" FOREIGN KEY ("user_high_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE "chat_members" (
      "chat_id" uuid NOT NULL,
      "user_id" uuid NOT NULL,
      "joined_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_chat_members" PRIMARY KEY ("chat_id", "user_id"),
      CONSTRAINT "fk_chat_members_chat" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE,
      CONSTRAINT "fk_chat_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      `CREATE INDEX "idx_chat_members_user_id" ON "chat_members" ("user_id")`,
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_chat_members_user_id"`);
    await queryRunner.query(`DROP TABLE "chat_members"`);
    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
