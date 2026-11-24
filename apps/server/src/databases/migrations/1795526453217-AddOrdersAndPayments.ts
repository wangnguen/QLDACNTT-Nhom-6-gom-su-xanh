import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrdersAndPayments1795526453217 implements MigrationInterface {
  name = 'AddOrdersAndPayments1795526453217'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "order_id" uuid NOT NULL,
                "product_id" uuid,
                "product_name" character varying(255) NOT NULL,
                "product_slug" character varying(110) NOT NULL,
                "image_url" text,
                "unit_price" integer NOT NULL,
                "quantity" integer NOT NULL,
                "line_total" integer NOT NULL,
                CONSTRAINT "CHK_order_items_price" CHECK (
                    "unit_price" >= 0
                    AND "line_total" = "unit_price" * "quantity"
                ),
                CONSTRAINT "CHK_order_items_quantity" CHECK ("quantity" > 0),
                CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_order_items_product_id" ON "order_items" ("product_id")
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."orders_status_enum" AS ENUM(
                'pending',
                'confirmed',
                'shipping',
                'delivered',
                'cancelled',
                'returned'
            )
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."orders_payment_method_enum" AS ENUM('cod', 'vnpay')
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."orders_payment_status_enum" AS ENUM('unpaid', 'paid', 'refund_pending', 'refunded')
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."orders_cancelled_by_enum" AS ENUM('user', 'admin')
        `)
    await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "code" character varying(12) NOT NULL,
                "user_id" uuid NOT NULL,
                "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending',
                "payment_method" "public"."orders_payment_method_enum" NOT NULL,
                "payment_status" "public"."orders_payment_status_enum" NOT NULL DEFAULT 'unpaid',
                "subtotal" integer NOT NULL,
                "shipping_fee" integer NOT NULL,
                "total" integer NOT NULL,
                "recipient_name" character varying(255) NOT NULL,
                "recipient_phone" character varying(15) NOT NULL,
                "shipping_address" character varying(255) NOT NULL,
                "note" text,
                "paid_at" TIMESTAMP WITH TIME ZONE,
                "confirmed_at" TIMESTAMP WITH TIME ZONE,
                "cancel_reason" character varying(255),
                "cancelled_by" "public"."orders_cancelled_by_enum",
                "cancelled_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "CHK_orders_amount" CHECK (
                    "subtotal" >= 0
                    AND "shipping_fee" >= 0
                    AND "total" = "subtotal" + "shipping_fee"
                ),
                CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_orders_user_id" ON "orders" ("user_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_orders_status" ON "orders" ("status")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_orders_payment_status" ON "orders" ("payment_status")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_orders_code" ON "orders" ("code")
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."payment_transactions_type_enum" AS ENUM('payment', 'refund')
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."payment_transactions_method_enum" AS ENUM('cod', 'vnpay')
        `)
    await queryRunner.query(`
            CREATE TYPE "public"."payment_transactions_status_enum" AS ENUM('pending', 'success', 'failed')
        `)
    await queryRunner.query(`
            CREATE TABLE "payment_transactions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "code" character varying(20) NOT NULL,
                "order_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "type" "public"."payment_transactions_type_enum" NOT NULL DEFAULT 'payment',
                "method" "public"."payment_transactions_method_enum" NOT NULL,
                "amount" integer NOT NULL,
                "status" "public"."payment_transactions_status_enum" NOT NULL DEFAULT 'pending',
                "gateway_transaction_no" character varying(50),
                "bank_code" character varying(20),
                "response_code" character varying(10),
                "completed_at" TIMESTAMP WITH TIME ZONE,
                "expires_at" TIMESTAMP WITH TIME ZONE,
                "note" character varying(255),
                CONSTRAINT "CHK_payment_transactions_amount" CHECK ("amount" > 0),
                CONSTRAINT "PK_d32b3c6b0d2c1d22604cbcc8c49" PRIMARY KEY ("id")
            )
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_payment_transactions_order_id" ON "payment_transactions" ("order_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_payment_transactions_user_id" ON "payment_transactions" ("user_id")
        `)
    await queryRunner.query(`
            CREATE INDEX "IDX_payment_transactions_status" ON "payment_transactions" ("status")
        `)
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_payment_transactions_code" ON "payment_transactions" ("code")
        `)
    await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "order_items"
            ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_transactions"
            ADD CONSTRAINT "FK_0f581511ac19ecb02dab437cd41" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_transactions"
            ADD CONSTRAINT "FK_77fab0556decc83a81a5bf8c25d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_77fab0556decc83a81a5bf8c25d"
        `)
    await queryRunner.query(`
            ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_0f581511ac19ecb02dab437cd41"
        `)
    await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"
        `)
    await queryRunner.query(`
            ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"
        `)
    await queryRunner.query(`
            ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_payment_transactions_code"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_payment_transactions_status"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_payment_transactions_user_id"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_payment_transactions_order_id"
        `)
    await queryRunner.query(`
            DROP TABLE "payment_transactions"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."payment_transactions_status_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."payment_transactions_method_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."payment_transactions_type_enum"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_orders_code"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_orders_payment_status"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_orders_status"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_orders_user_id"
        `)
    await queryRunner.query(`
            DROP TABLE "orders"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."orders_cancelled_by_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."orders_payment_status_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."orders_payment_method_enum"
        `)
    await queryRunner.query(`
            DROP TYPE "public"."orders_status_enum"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_order_items_product_id"
        `)
    await queryRunner.query(`
            DROP INDEX "public"."IDX_order_items_order_id"
        `)
    await queryRunner.query(`
            DROP TABLE "order_items"
        `)
  }
}
