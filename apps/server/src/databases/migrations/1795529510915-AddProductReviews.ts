import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProductReviews1795529510915 implements MigrationInterface {
  name = 'AddProductReviews1795529510915'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "product_reviews" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "product_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "order_id" uuid,
                "rating" smallint NOT NULL,
                "comment" text,
                "is_hidden" boolean NOT NULL DEFAULT false,
                "admin_reply" text,
                "replied_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "CHK_product_reviews_rating" CHECK (
                    "rating" BETWEEN 1 AND 5
                ),
                CONSTRAINT "PK_67c1501aea1b0633ec441b00bd5" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_product_reviews_product_id" ON "product_reviews" ("product_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_product_reviews_user_id" ON "product_reviews" ("user_id")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_product_reviews_product_id_user_id" ON "product_reviews" ("product_id", "user_id")
            WHERE "deleted_at" IS NULL
        `)
    await queryRunner.query(`
            ALTER TABLE "product_reviews"
            ADD CONSTRAINT "FK_1d3fbb451c2b63d0a763f3ff5b1" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "product_reviews"
            ADD CONSTRAINT "FK_8306941b81cb5be7d521bdc0834" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "product_reviews"
            ADD CONSTRAINT "FK_c13dbe2226de0de7a086f12dffa" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "product_reviews" DROP CONSTRAINT "FK_c13dbe2226de0de7a086f12dffa"
        `)
    await queryRunner.query(`
            ALTER TABLE "product_reviews" DROP CONSTRAINT "FK_8306941b81cb5be7d521bdc0834"
        `)
    await queryRunner.query(`
            ALTER TABLE "product_reviews" DROP CONSTRAINT "FK_1d3fbb451c2b63d0a763f3ff5b1"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_product_reviews_product_id_user_id"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_product_reviews_user_id"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_product_reviews_product_id"
        `)
    await queryRunner.query(`
            DROP TABLE "product_reviews"
        `)
  }
}
