import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPosts1795529210763 implements MigrationInterface {
  name = 'AddPosts1795529210763'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."posts_status_enum" AS ENUM('draft', 'published')
        `)
    await queryRunner.query(`
            CREATE TABLE "posts" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "title" character varying(255) NOT NULL,
                "slug" character varying(110) NOT NULL,
                "excerpt" character varying(500),
                "content" text NOT NULL,
                "cover_image_url" text,
                "category_id" uuid NOT NULL,
                "status" "public"."posts_status_enum" NOT NULL DEFAULT 'draft',
                "published_at" TIMESTAMP WITH TIME ZONE,
                "author_id" uuid,
                "view_count" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_posts_category_id" ON "posts" ("category_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_posts_status_published_at" ON "posts" ("status", "published_at")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_posts_slug" ON "posts" ("slug")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "posts"
            ADD CONSTRAINT "FK_852f266adc5d67c40405c887b49" FOREIGN KEY ("category_id") REFERENCES "post_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "posts"
            ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"
        `)
    await queryRunner.query(`
            ALTER TABLE "posts" DROP CONSTRAINT "FK_852f266adc5d67c40405c887b49"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_posts_slug"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_posts_status_published_at"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_posts_category_id"
        `)
    await queryRunner.query(`
            DROP TABLE "posts"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."posts_status_enum"
        `)
  }
}
