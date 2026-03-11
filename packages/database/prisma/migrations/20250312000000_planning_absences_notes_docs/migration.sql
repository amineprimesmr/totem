-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('COURSE', 'EXAM', 'WORKSHOP', 'MEETING', 'OTHER');
CREATE TYPE "AbsenceType" AS ENUM ('ABSENCE', 'LATE', 'EXCUSED');
CREATE TYPE "DocumentType" AS ENUM ('SIFA', 'CERFA', 'CONVENTION', 'CONTRACT', 'BULLETIN', 'OTHER');

-- AlterTable Formation: add externalId, externalSource (pour migration Galia)
ALTER TABLE "Formation" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Formation" ADD COLUMN "externalSource" TEXT;
CREATE UNIQUE INDEX "Formation_externalId_key" ON "Formation"("externalId") WHERE "externalId" IS NOT NULL;

-- AlterTable Promotion: add externalId, externalSource
ALTER TABLE "Promotion" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Promotion" ADD COLUMN "externalSource" TEXT;
CREATE UNIQUE INDEX "Promotion_externalId_key" ON "Promotion"("externalId") WHERE "externalId" IS NOT NULL;

-- CreateTable Room
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "building" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT,
    "roomId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "type" "SessionType" NOT NULL DEFAULT 'COURSE',
    "externalId" TEXT,
    "externalSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Session_promotionId_idx" ON "Session"("promotionId");
CREATE INDEX "Session_roomId_idx" ON "Session"("roomId");
CREATE INDEX "Session_startAt_idx" ON "Session"("startAt");

-- CreateTable Absence
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "sessionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "AbsenceType" NOT NULL DEFAULT 'ABSENCE',
    "justified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Absence_candidateId_idx" ON "Absence"("candidateId");
CREATE INDEX "Absence_sessionId_idx" ON "Absence"("sessionId");
CREATE INDEX "Absence_date_idx" ON "Absence"("date");

-- CreateTable Grade
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "sessionId" TEXT,
    "subject" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "scale" DOUBLE PRECISION DEFAULT 20,
    "coefficient" DOUBLE PRECISION DEFAULT 1,
    "label" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Grade_candidateId_idx" ON "Grade"("candidateId");
CREATE INDEX "Grade_sessionId_idx" ON "Grade"("sessionId");

-- CreateTable Document
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Document_candidateId_idx" ON "Document"("candidateId");
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Document" ADD CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
