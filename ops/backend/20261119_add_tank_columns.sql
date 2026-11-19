-- Run against the database used by backend-rsa-ugm before testing GET /api/tanks.
-- Matches src/db/schema/tanks.ts in PMLD-RSA/backend-rsa-ugm (master, 6f110f3).
-- Idempotent and additive; does not insert or modify tank/sensor records.
BEGIN;

ALTER TABLE tanks
  ADD COLUMN IF NOT EXISTS min_distance_cm numeric(6, 2) NOT NULL DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS max_distance_cm numeric(6, 2) NOT NULL DEFAULT 350.00,
  ADD COLUMN IF NOT EXISTS latitude numeric(10, 7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10, 7);

COMMIT;
