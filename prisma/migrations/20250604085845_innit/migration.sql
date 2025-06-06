-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Mahasiswa', 'Dosen_Wali', 'Kepala_Program_Studi');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "fullName" TEXT NOT NULL,
    "nim" TEXT,
    "DosenId" TEXT,
    "publicKey" TEXT,
    "privateKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "digitalSignature" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_shares" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "advisorId" TEXT NOT NULL,
    "shareX" INTEGER NOT NULL,
    "shareY" TEXT NOT NULL,

    CONSTRAINT "secret_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "secret_shares_recordId_advisorId_key" ON "secret_shares"("recordId", "advisorId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_DosenId_fkey" FOREIGN KEY ("DosenId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_records" ADD CONSTRAINT "academic_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_shares" ADD CONSTRAINT "secret_shares_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "academic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_shares" ADD CONSTRAINT "secret_shares_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
