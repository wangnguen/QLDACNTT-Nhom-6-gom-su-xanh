import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkshops1794740000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE workshops (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(255) NOT NULL,
      content text NOT NULL, artisan varchar(255) NOT NULL,
      starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
      capacity integer NOT NULL CHECK(capacity > 0),
      status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN ('open','hidden','cancelled')),
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK(ends_at > starts_at))`)
    await q.query(`CREATE TABLE workshop_registrations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      workshop_id uuid NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      seats integer NOT NULL CHECK(seats > 0),
      status varchar(20) NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(workshop_id,user_id))`)
    await q.query('CREATE INDEX IDX_workshop_registrations_class ON workshop_registrations(workshop_id,status)')
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE workshop_registrations')
    await q.query('DROP TABLE workshops')
  }
}
