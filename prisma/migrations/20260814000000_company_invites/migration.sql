-- CreateEnum
CREATE TYPE "CompanyRole" AS ENUM ('OWNER', 'STAFF');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "jobTitle" TEXT;
ALTER TABLE "customers" ADD COLUMN "companyRole" "CompanyRole" NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE "company_invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_invites_token_key" ON "company_invites"("token");
CREATE INDEX "company_invites_companyId_idx" ON "company_invites"("companyId");

ALTER TABLE "company_invites" ADD CONSTRAINT "company_invites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_invites" ADD CONSTRAINT "company_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Earliest teammate at each company becomes the owner (HR/manager who registered first).
UPDATE "customers" AS c
SET "companyRole" = 'OWNER'
WHERE c."companyId" IS NOT NULL
  AND c.id IN (
    SELECT DISTINCT ON ("companyId") id
    FROM "customers"
    WHERE "companyId" IS NOT NULL
    ORDER BY "companyId", "createdAt" ASC
  );
