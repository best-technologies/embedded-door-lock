-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'terminated');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('rfid', 'fingerprint', 'keypad');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('success', 'failed');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('staff', 'intern', 'nysc', 'trainee', 'admin', 'contractor', 'visitor');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('Engineering', 'HR', 'Finance', 'Operations', 'IT', 'Sales', 'Marketing', 'Administration', 'Security', 'Maintenance');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'early_departure', 'half_day', 'holiday', 'weekend');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('check_in', 'check_out');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "gender" "Gender",
    "employeeId" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "role" "UserRole" NOT NULL DEFAULT 'staff',
    "department" TEXT DEFAULT 'Engineering',
    "accessLevel" INTEGER NOT NULL DEFAULT 1,
    "allowedAccessMethods" "AccessMethod"[],
    "keypadPin" TEXT,
    "password" TEXT,
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_pictures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pictures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfid_tags" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfid_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fingerprint_ids" (
    "id" TEXT NOT NULL,
    "fingerprintId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fingerprint_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'offline',
    "firmwareVersion" TEXT,
    "lastSeen" TIMESTAMP(3),
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "method" "AccessMethod" NOT NULL,
    "rfidUid" TEXT,
    "fingerprintId" INTEGER,
    "keypadPin" TEXT,
    "status" "AccessStatus" NOT NULL,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_access_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_access_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "status" "AttendanceStatus" NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "holidayName" TEXT,
    "minutesLate" INTEGER,
    "minutesEarly" INTEGER,
    "totalHours" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_role_createdAt_idx" ON "users"("role", "createdAt");

-- CreateIndex
CREATE INDEX "users_department_idx" ON "users"("department");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_userId_idx" ON "users"("userId");

-- CreateIndex
CREATE INDEX "users_accessLevel_idx" ON "users"("accessLevel");

-- CreateIndex
CREATE UNIQUE INDEX "profile_pictures_userId_key" ON "profile_pictures"("userId");

-- CreateIndex
CREATE INDEX "rfid_tags_tag_idx" ON "rfid_tags"("tag");

-- CreateIndex
CREATE INDEX "rfid_tags_userId_idx" ON "rfid_tags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rfid_tags_tag_userId_key" ON "rfid_tags"("tag", "userId");

-- CreateIndex
CREATE INDEX "fingerprint_ids_fingerprintId_idx" ON "fingerprint_ids"("fingerprintId");

-- CreateIndex
CREATE INDEX "fingerprint_ids_userId_idx" ON "fingerprint_ids"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fingerprint_ids_fingerprintId_userId_key" ON "fingerprint_ids"("fingerprintId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "devices_deviceId_key" ON "devices"("deviceId");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "devices_deviceId_idx" ON "devices"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "access_logs_logId_key" ON "access_logs"("logId");

-- CreateIndex
CREATE INDEX "access_logs_userId_idx" ON "access_logs"("userId");

-- CreateIndex
CREATE INDEX "access_logs_deviceId_idx" ON "access_logs"("deviceId");

-- CreateIndex
CREATE INDEX "access_logs_status_idx" ON "access_logs"("status");

-- CreateIndex
CREATE INDEX "access_logs_method_idx" ON "access_logs"("method");

-- CreateIndex
CREATE INDEX "access_logs_timestamp_idx" ON "access_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_access_codes_code_key" ON "temporary_access_codes"("code");

-- CreateIndex
CREATE INDEX "temporary_access_codes_code_idx" ON "temporary_access_codes"("code");

-- CreateIndex
CREATE INDEX "temporary_access_codes_userId_idx" ON "temporary_access_codes"("userId");

-- CreateIndex
CREATE INDEX "temporary_access_codes_expiresAt_idx" ON "temporary_access_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "temporary_access_codes_used_idx" ON "temporary_access_codes"("used");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_codes_code_key" ON "password_reset_codes"("code");

-- CreateIndex
CREATE INDEX "password_reset_codes_code_idx" ON "password_reset_codes"("code");

-- CreateIndex
CREATE INDEX "password_reset_codes_email_idx" ON "password_reset_codes"("email");

-- CreateIndex
CREATE INDEX "password_reset_codes_expiresAt_idx" ON "password_reset_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "password_reset_codes_used_idx" ON "password_reset_codes"("used");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_attendanceId_key" ON "attendance"("attendanceId");

-- CreateIndex
CREATE INDEX "attendance_userId_idx" ON "attendance"("userId");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX "attendance_isWorkingDay_idx" ON "attendance"("isWorkingDay");

-- CreateIndex
CREATE INDEX "attendance_isHoliday_idx" ON "attendance"("isHoliday");

-- CreateIndex
CREATE INDEX "attendance_userId_date_idx" ON "attendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_userId_date_key" ON "attendance"("userId", "date");

-- CreateIndex
CREATE INDEX "holidays_date_idx" ON "holidays"("date");

-- CreateIndex
CREATE INDEX "holidays_isRecurring_idx" ON "holidays"("isRecurring");

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_key" ON "holidays"("date");

-- AddForeignKey
ALTER TABLE "profile_pictures" ADD CONSTRAINT "profile_pictures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfid_tags" ADD CONSTRAINT "rfid_tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fingerprint_ids" ADD CONSTRAINT "fingerprint_ids_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_access_codes" ADD CONSTRAINT "temporary_access_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
