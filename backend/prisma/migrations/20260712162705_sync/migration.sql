-- CreateEnum
CREATE TYPE "BishiStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BishiMemberStatus" AS ENUM ('ACTIVE', 'WON');

-- CreateEnum
CREATE TYPE "BishiPaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'DUE', 'EXEMPT', 'PENDING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMode" ADD VALUE 'OLD_SILVER';
ALTER TYPE "PaymentMode" ADD VALUE 'FINE_GOLD';
ALTER TYPE "PaymentMode" ADD VALUE 'FINE_SILVER';

-- CreateTable
CREATE TABLE "bishis" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "winnersPerMonth" INTEGER NOT NULL DEFAULT 1,
    "status" "BishiStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bishis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bishi_members" (
    "id" SERIAL NOT NULL,
    "bishiId" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "memberNumber" INTEGER NOT NULL,
    "status" "BishiMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "wonMonthNumber" INTEGER,
    "wonDate" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bishi_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bishi_payments" (
    "id" SERIAL NOT NULL,
    "bishiId" INTEGER NOT NULL,
    "bishiMemberId" INTEGER NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "dueCarriedForward" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPayable" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalOutstanding" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" "BishiPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMode" "PaymentMode",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bishi_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bishi_winners" (
    "id" SERIAL NOT NULL,
    "bishiId" INTEGER NOT NULL,
    "bishiMemberId" INTEGER NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "monthLabel" TEXT NOT NULL,
    "announcedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "announcedBy" TEXT NOT NULL,

    CONSTRAINT "bishi_winners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bishi_members_bishiId_customerId_key" ON "bishi_members"("bishiId", "customerId");

-- AddForeignKey
ALTER TABLE "bishi_members" ADD CONSTRAINT "bishi_members_bishiId_fkey" FOREIGN KEY ("bishiId") REFERENCES "bishis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bishi_members" ADD CONSTRAINT "bishi_members_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bishi_payments" ADD CONSTRAINT "bishi_payments_bishiId_fkey" FOREIGN KEY ("bishiId") REFERENCES "bishis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bishi_payments" ADD CONSTRAINT "bishi_payments_bishiMemberId_fkey" FOREIGN KEY ("bishiMemberId") REFERENCES "bishi_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bishi_winners" ADD CONSTRAINT "bishi_winners_bishiId_fkey" FOREIGN KEY ("bishiId") REFERENCES "bishis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bishi_winners" ADD CONSTRAINT "bishi_winners_bishiMemberId_fkey" FOREIGN KEY ("bishiMemberId") REFERENCES "bishi_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
