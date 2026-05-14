-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kim_minigame_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kim_minigame_passed" BOOLEAN NOT NULL DEFAULT false;
