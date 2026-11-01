import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCartItems1793528366536 implements MigrationInterface {
  name = 'AddCartItems1793528366536'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "cart_items" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                CONSTRAINT "CHK_cart_items_quantity" CHECK ("quantity" > 0),
                CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_cart_items_product_id" ON "cart_items" ("product_id")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_cart_items_user_id_product_id" ON "cart_items" ("user_id", "product_id")
        `)
    await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "FK_b7213c20c1ecdc6597abc8f1212" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "cart_items"
            ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"
        `)
    await queryRunner.query(`
            ALTER TABLE "cart_items" DROP CONSTRAINT "FK_b7213c20c1ecdc6597abc8f1212"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_cart_items_user_id_product_id"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_cart_items_product_id"
        `)
    await queryRunner.query(`
            DROP TABLE "cart_items"
        `)
  }
}
