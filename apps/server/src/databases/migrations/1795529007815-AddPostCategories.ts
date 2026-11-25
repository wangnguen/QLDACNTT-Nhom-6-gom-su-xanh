import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPostCategories1795529007815 implements MigrationInterface {
  name = 'AddPostCategories1795529007815'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "post_categories" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "name" character varying(100) NOT NULL,
                "slug" character varying(110) NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_9c45c4e9fb6ebf296990e1d3972" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_post_categories_slug" ON "post_categories" ("slug")
            WHERE "deleted_at" IS NULL
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "public"."IDX_post_categories_slug"
        `)
    await queryRunner.query(`
            DROP TABLE "post_categories"
        `)
  }
}
