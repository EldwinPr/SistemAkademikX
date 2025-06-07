/*
  Warnings:

  - Added the required column `createdBy` to the `academic_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prime` to the `secret_shares` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "academic_records" ADD COLUMN     "createdBy" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "secret_shares" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "prime" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "direct_keys" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedAESKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "direct_keys_recordId_userId_key" ON "direct_keys"("recordId", "userId");

-- AddForeignKey
ALTER TABLE "direct_keys" ADD CONSTRAINT "direct_keys_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "academic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_keys" ADD CONSTRAINT "direct_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
