-- AlterTable
ALTER TABLE "Conversation"
ADD COLUMN "speaker" TEXT NOT NULL DEFAULT 'ritu';

ALTER TABLE "Conversation"
ALTER COLUMN "speaker" DROP DEFAULT;
