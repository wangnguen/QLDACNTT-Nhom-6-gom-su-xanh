import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialCreate1793115462329 implements MigrationInterface {
  name = 'InitialCreate1793115462329'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')
        `)
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "full_name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "phone" character varying(15),
                "password" character varying(72),
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
                "avatar_url" text,
                "is_email_verified" boolean NOT NULL DEFAULT false,
                "last_login_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_users_role" ON "users" ("role")
        `)
    await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "token" character varying(64) NOT NULL,
                "user_id" uuid NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "absolute_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"),
                CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('VERIFY_EMAIL', 'RESET_PASSWORD')
        `)
    await queryRunner.query(`
            CREATE TABLE "auth_tokens" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "token" character varying(64) NOT NULL,
                "type" "public"."auth_tokens_type_enum" NOT NULL,
                "user_id" uuid NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "used_at" TIMESTAMP WITH TIME ZONE,
                "attempts" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_auth_tokens_user_id_type" ON "auth_tokens" ("user_id", "type")
        `)
    await queryRunner.query(`
            ALTER TABLE "refresh_tokens"
            ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "auth_tokens"
            ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"
        `)
    await queryRunner.query(`
            ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_auth_tokens_user_id_type"
        `)
    await queryRunner.query(`
            DROP TABLE "auth_tokens"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."auth_tokens_type_enum"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_refresh_tokens_user_id"
        `)
    await queryRunner.query(`
            DROP TABLE "refresh_tokens"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_users_role"
        `)
    await queryRunner.query(`
            DROP TABLE "users"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `)
  }
}
