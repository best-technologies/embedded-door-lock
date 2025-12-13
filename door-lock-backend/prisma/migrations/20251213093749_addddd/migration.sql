/*
  Warnings:

  - The `department` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Department" AS ENUM ('Engineering', 'HR', 'Finance', 'Operations', 'IT', 'Sales', 'Marketing', 'Administration', 'Security', 'Maintenance');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "department",
ADD COLUMN     "department" "Department";

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");
