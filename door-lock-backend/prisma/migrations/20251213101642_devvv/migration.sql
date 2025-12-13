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
