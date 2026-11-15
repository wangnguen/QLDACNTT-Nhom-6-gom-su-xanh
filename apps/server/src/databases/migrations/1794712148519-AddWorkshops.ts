import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkshops1794712148519 implements MigrationInterface {
  name = 'AddWorkshops1794712148519'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "workshops" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "name" character varying(255) NOT NULL,
                "slug" character varying(110) NOT NULL,
                "description" text,
                "instructor" character varying(100),
                "location" character varying(255) NOT NULL,
                "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "registration_deadline" TIMESTAMP WITH TIME ZONE,
                "price" integer NOT NULL,
                "capacity" integer NOT NULL,
                "image_urls" text array NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "CHK_workshops_time" CHECK ("ends_at" > "starts_at"),
                CONSTRAINT "CHK_workshops_capacity" CHECK ("capacity" > 0),
                CONSTRAINT "CHK_workshops_price" CHECK ("price" >= 0),
                CONSTRAINT "PK_6d0e82a124f5b53df91c8989848" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_workshops_starts_at" ON "workshops" ("starts_at")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_workshops_slug" ON "workshops" ("slug")
            WHERE "deleted_at" IS NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_workshops_slug"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_workshops_starts_at"
        `)
    await queryRunner.query(`
            DROP TABLE "workshops"
        `)
  }
}
