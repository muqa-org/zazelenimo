/*
  Warnings:

  - You are about to drop the `auth_nonce` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "auth_nonce" DROP CONSTRAINT "auth_nonce_user_id_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nonce" TEXT,
ADD COLUMN     "nonce_expiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "auth_nonce";
