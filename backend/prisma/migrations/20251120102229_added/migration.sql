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

-- AddForeignKey
ALTER TABLE "temporary_access_codes" ADD CONSTRAINT "temporary_access_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
