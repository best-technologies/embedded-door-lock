/*
  Warnings:

  - The `department` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "department",
ADD COLUMN     "department" TEXT DEFAULT 'Engineering';

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");
