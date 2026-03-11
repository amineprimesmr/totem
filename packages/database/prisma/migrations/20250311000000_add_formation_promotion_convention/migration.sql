-- CreateEnum
CREATE TYPE "ConventionStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Formation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "contractType" "ContractType" NOT NULL DEFAULT 'APPRENTICESHIP',
    "durationMonths" INTEGER,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convention" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "promotionId" TEXT,
    "status" "ConventionStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "documentPath" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Promotion_formationId_idx" ON "Promotion"("formationId");
CREATE INDEX "Promotion_year_idx" ON "Promotion"("year");
CREATE UNIQUE INDEX "Convention_candidateId_offerId_key" ON "Convention"("candidateId", "offerId");
CREATE INDEX "Convention_candidateId_idx" ON "Convention"("candidateId");
CREATE INDEX "Convention_companyId_idx" ON "Convention"("companyId");
CREATE INDEX "Convention_promotionId_idx" ON "Convention"("promotionId");
CREATE INDEX "Convention_status_idx" ON "Convention"("status");

-- AlterTable Candidate: add promotionId
ALTER TABLE "Candidate" ADD COLUMN "promotionId" TEXT;
CREATE INDEX "Candidate_promotionId_idx" ON "Candidate"("promotionId");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Convention" ADD CONSTRAINT "Convention_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Convention" ADD CONSTRAINT "Convention_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Convention" ADD CONSTRAINT "Convention_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Convention" ADD CONSTRAINT "Convention_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
