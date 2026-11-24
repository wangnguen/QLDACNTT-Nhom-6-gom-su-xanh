import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrderShipping1795527289950 implements MigrationInterface {
  name = 'AddOrderShipping1795527289950'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "shipping_carrier" character varying(20)
        `)
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "tracking_code" character varying(50)
        `)
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "shipped_at" TIMESTAMP WITH TIME ZONE
        `)
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "delivered_at" TIMESTAMP WITH TIME ZONE
        `)
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "returned_at" TIMESTAMP WITH TIME ZONE
        `)
    await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "delivery_note" character varying(255)
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "delivery_note"
        `)
    await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "returned_at"
        `)
    await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "delivered_at"
        `)
    await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "shipped_at"
        `)
    await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "tracking_code"
        `)
    await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "shipping_carrier"
        `)
  }
}
