-- Expire handoff codes, limit brute-force attempts, and retain a verification timestamp.
ALTER TABLE "Recovery"
ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "codeVerifiedAt" TIMESTAMP(3);
