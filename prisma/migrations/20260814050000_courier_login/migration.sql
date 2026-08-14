ALTER TABLE "couriers" ADD COLUMN IF NOT EXISTS "id" TEXT;
-- created via Prisma db push; this file documents the courier login + order QR claim.

CREATE TABLE IF NOT EXISTS "couriers" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "couriers_email_key" ON "couriers"("email");

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courierId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courierName" TEXT;

DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_courierId_fkey"
    FOREIGN KEY ("courierId") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "orders_courierId_idx" ON "orders"("courierId");
