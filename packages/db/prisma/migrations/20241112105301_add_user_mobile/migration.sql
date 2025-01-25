/*
  Warnings:

  - A unique constraint covering the columns `[mobile]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "mobile" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_mobile_key" ON "user"("mobile");
