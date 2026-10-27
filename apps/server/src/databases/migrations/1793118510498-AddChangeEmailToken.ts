import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddChangeEmailToken1793118510498 implements MigrationInterface {
  name = 'AddChangeEmailToken1793118510498'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_tokens"
            ADD "new_email" character varying(255)
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_auth_tokens_user_id_type"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."auth_tokens_type_enum"
            RENAME TO "auth_tokens_type_enum_old"
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('VERIFY_EMAIL', 'RESET_PASSWORD', 'CHANGE_EMAIL')
        `)
    await queryRunner.query(`
            ALTER TABLE "auth_tokens"
            ALTER COLUMN "type" TYPE "public"."auth_tokens_type_enum" USING "type"::"text"::"public"."auth_tokens_type_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."auth_tokens_type_enum_old"
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_auth_tokens_user_id_type" ON "auth_tokens" ("user_id", "type")
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum cũ không có CHANGE_EMAIL — xoá các mã đổi email đang chờ trước khi đổi kiểu cột
    await queryRunner.query(`
            DELETE FROM "auth_tokens" WHERE "type" = 'CHANGE_EMAIL'
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_auth_tokens_user_id_type"
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."auth_tokens_type_enum_old" AS ENUM('VERIFY_EMAIL', 'RESET_PASSWORD')
        `)
    await queryRunner.query(`
            ALTER TABLE "auth_tokens"
            ALTER COLUMN "type" TYPE "public"."auth_tokens_type_enum_old" USING "type"::"text"::"public"."auth_tokens_type_enum_old"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."auth_tokens_type_enum"
        `)
    await queryRunner.query(`
            ALTER TYPE "public"."auth_tokens_type_enum_old"
            RENAME TO "auth_tokens_type_enum"
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_auth_tokens_user_id_type" ON "auth_tokens" ("user_id", "type")
        `)
    await queryRunner.query(`
            ALTER TABLE "auth_tokens" DROP COLUMN "new_email"
        `)
  }
}
