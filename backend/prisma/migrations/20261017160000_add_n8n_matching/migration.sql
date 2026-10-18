ALTER TABLE "Item"
ADD COLUMN "automationProcessedAt" TIMESTAMP(3);

ALTER TABLE "Notification"
ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "Notification_dedupeKey_key"
ON "Notification"("dedupeKey");
