/*
  Warnings:

  - Added the required column `email` to the `Professional` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "email" TEXT NOT NULL;
