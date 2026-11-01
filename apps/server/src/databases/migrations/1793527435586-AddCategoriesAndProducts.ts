import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCategoriesAndProducts1793527435586 implements MigrationInterface {
  name = 'AddCategoriesAndProducts1793527435586'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "name" character varying(100) NOT NULL,
                "slug" character varying(100) NOT NULL,
                "description" text,
                "image_url" text,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_categories_slug" ON "categories" ("slug")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "name" character varying(255) NOT NULL,
                "slug" character varying(110) NOT NULL,
                "description" text,
                "price" integer NOT NULL,
                "stock" integer NOT NULL DEFAULT '0',
                "material" character varying(100),
                "dimensions" character varying(100),
                "image_urls" text array NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "category_id" uuid NOT NULL,
                CONSTRAINT "CHK_products_stock" CHECK ("stock" >= 0),
                CONSTRAINT "CHK_products_price" CHECK ("price" >= 0),
                CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_products_category_id" ON "products" ("category_id")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_products_slug" ON "products" ("slug")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_products_slug"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_products_category_id"
        `)
    await queryRunner.query(`
            DROP TABLE "products"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_categories_slug"
        `)
    await queryRunner.query(`
            DROP TABLE "categories"
        `)
  }
}
