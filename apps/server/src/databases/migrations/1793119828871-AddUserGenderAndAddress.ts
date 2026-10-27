import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserGenderAndAddress1793119828871 implements MigrationInterface {
  name = 'AddUserGenderAndAddress1793119828871'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other')
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "gender" "public"."users_gender_enum"
        `)
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "address" character varying(255)
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "address"
        `)
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "gender"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."users_gender_enum"
        `)
  }
}
