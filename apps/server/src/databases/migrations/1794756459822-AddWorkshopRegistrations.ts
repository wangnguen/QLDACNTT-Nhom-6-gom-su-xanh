import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkshopRegistrations1794756459822 implements MigrationInterface {
  name = 'AddWorkshopRegistrations1794756459822'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."workshop_registrations_status_enum" AS ENUM('pending', 'confirmed', 'attended', 'cancelled')
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."workshop_registrations_cancelled_by_enum" AS ENUM('user', 'admin')
        `)
    await queryRunner.query(`
            CREATE TABLE "workshop_registrations" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "code" character varying(12) NOT NULL,
                "workshop_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "seats" integer NOT NULL,
                "unit_price" integer NOT NULL,
                "total_price" integer NOT NULL,
                "contact_name" character varying(255) NOT NULL,
                "contact_phone" character varying(15) NOT NULL,
                "contact_email" character varying(255) NOT NULL,
                "note" text,
                "status" "public"."workshop_registrations_status_enum" NOT NULL DEFAULT 'pending',
                "cancel_reason" character varying(255),
                "cancelled_by" "public"."workshop_registrations_cancelled_by_enum",
                "cancelled_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "CHK_workshop_registrations_price" CHECK (
                    "unit_price" >= 0
                    AND "total_price" = "unit_price" * "seats"
                ),
                CONSTRAINT "CHK_workshop_registrations_seats" CHECK ("seats" > 0),
                CONSTRAINT "PK_70cf3ddc524df0a829737935939" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_workshop_registrations_workshop_id" ON "workshop_registrations" ("workshop_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_workshop_registrations_user_id" ON "workshop_registrations" ("user_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_workshop_registrations_status" ON "workshop_registrations" ("status")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_workshop_registrations_workshop_id_user_id" ON "workshop_registrations" ("workshop_id", "user_id")
            WHERE "status" <> 'cancelled'
                AND "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_workshop_registrations_code" ON "workshop_registrations" ("code")
        `)
    await queryRunner.query(`
            ALTER TABLE "workshop_registrations"
            ADD CONSTRAINT "FK_7cbbd46cce4ba6ff2cba16d8aa9" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "workshop_registrations"
            ADD CONSTRAINT "FK_280c85504bd7afe86fad69bcfab" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "workshop_registrations" DROP CONSTRAINT "FK_280c85504bd7afe86fad69bcfab"
        `)
    await queryRunner.query(`
            ALTER TABLE "workshop_registrations" DROP CONSTRAINT "FK_7cbbd46cce4ba6ff2cba16d8aa9"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_workshop_registrations_code"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_workshop_registrations_workshop_id_user_id"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_workshop_registrations_status"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_workshop_registrations_user_id"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_workshop_registrations_workshop_id"
        `)
    await queryRunner.query(`
            DROP TABLE "workshop_registrations"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."workshop_registrations_cancelled_by_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."workshop_registrations_status_enum"
        `)
  }
}
