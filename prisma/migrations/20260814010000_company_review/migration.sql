CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "companies" ADD COLUMN "status" "CompanyStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "companies" ADD COLUMN "registeredById" TEXT;
ALTER TABLE "companies" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "reviewNote" TEXT;

CREATE INDEX "companies_registeredById_idx" ON "companies"("registeredById");

ALTER TABLE "companies" ADD CONSTRAINT "companies_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
