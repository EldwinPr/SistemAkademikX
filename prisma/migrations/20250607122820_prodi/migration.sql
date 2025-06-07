/*
  Warnings:

  - A unique constraint covering the columns `[role,programStudi]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProgramStudi" AS ENUM ('Teknik_Informatika', 'Sistem_Teknologi_Informasi');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "programStudi" "ProgramStudi";

-- CreateIndex
CREATE UNIQUE INDEX "users_role_programStudi_key" ON "users"("role", "programStudi");
