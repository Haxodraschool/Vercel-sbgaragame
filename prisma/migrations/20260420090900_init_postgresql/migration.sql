-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('ENGINE', 'EXHAUST', 'COOLING', 'CREW', 'TOOL', 'TURBO', 'FUEL', 'FILTER', 'SUSPENSION', 'NITROUS', 'TIRE');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('BUFF', 'DEBUFF', 'UTILITY');

-- CreateEnum
CREATE TYPE "TriggerCondition" AS ENUM ('PASSIVE', 'ON_TEST', 'ADJACENT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PASSIVE', 'CHOICE');

-- CreateEnum
CREATE TYPE "EndingType" AS ENUM ('STANDARD', 'PERFECT', 'FINAL', 'BOSS_HIDDEN', 'BAD');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'PLAYER',
    "gold" BIGINT NOT NULL DEFAULT 500,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" BIGINT NOT NULL DEFAULT 0,
    "current_day" INTEGER NOT NULL DEFAULT 1,
    "garage_health" INTEGER NOT NULL DEFAULT 100,
    "tech_points" BIGINT NOT NULL DEFAULT 0,
    "crew_slots" INTEGER NOT NULL DEFAULT 1,
    "is_final_round" BOOLEAN NOT NULL DEFAULT false,
    "total_explosions" INTEGER NOT NULL DEFAULT 0,
    "smuggler_penalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "has_defeated_ep" BOOLEAN NOT NULL DEFAULT false,
    "shop_tax_modifier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "shop_tax_expires_at" INTEGER NOT NULL DEFAULT 0,
    "is_in_north_korea" BOOLEAN NOT NULL DEFAULT false,
    "north_korea_day_count" INTEGER NOT NULL DEFAULT 0,
    "has_kim_buff" BOOLEAN NOT NULL DEFAULT false,
    "has_underworld_buff" BOOLEAN NOT NULL DEFAULT false,
    "last_smuggler_buy_day" INTEGER NOT NULL DEFAULT 0,
    "is_kim_assassinated" BOOLEAN NOT NULL DEFAULT false,
    "has_defeated_donald_trump" BOOLEAN NOT NULL DEFAULT false,
    "has_moscow_buff" BOOLEAN NOT NULL DEFAULT false,
    "moscow_buff_day" INTEGER NOT NULL DEFAULT 0,
    "active_perk_code" VARCHAR(50),
    "total_shop_spent" BIGINT NOT NULL DEFAULT 0,
    "total_packs_opened" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_quests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "day_number" INTEGER NOT NULL,
    "is_boss" BOOLEAN NOT NULL DEFAULT false,
    "boss_config_id" INTEGER,
    "required_power" INTEGER NOT NULL,
    "reward_gold" INTEGER NOT NULL,
    "customer_budget" INTEGER NOT NULL DEFAULT 0,
    "status" "QuestStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "daily_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_active_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "remaining_turns" INTEGER NOT NULL,

    CONSTRAINT "user_active_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_endings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ending_id" INTEGER NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_endings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "CardType" NOT NULL,
    "rarity" INTEGER NOT NULL,
    "stat_power" INTEGER NOT NULL DEFAULT 0,
    "stat_heat" INTEGER NOT NULL DEFAULT 0,
    "stat_stability" INTEGER NOT NULL DEFAULT 0,
    "image_url" VARCHAR(255),
    "description" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 100,
    "unlock_type" VARCHAR(20),

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_effects" (
    "id" SERIAL NOT NULL,
    "card_id" INTEGER NOT NULL,
    "effect_type" "EffectType" NOT NULL,
    "trigger_condition" "TriggerCondition" NOT NULL,
    "target_stat" VARCHAR(50) NOT NULL,
    "effect_value" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "card_effects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_combos" (
    "id" SERIAL NOT NULL,
    "card_id_1" INTEGER NOT NULL,
    "card_id_2" INTEGER NOT NULL,
    "effect_type" VARCHAR(50) NOT NULL,
    "effect_value" DOUBLE PRECISION NOT NULL,
    "name" VARCHAR(100) NOT NULL DEFAULT '',
    "description" TEXT,

    CONSTRAINT "card_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boss_configs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "special_condition" VARCHAR(50),
    "required_power" INTEGER NOT NULL,
    "reward_gold" INTEGER NOT NULL DEFAULT 1000,
    "image_url" VARCHAR(255),

    CONSTRAINT "boss_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_events" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL,
    "target_attribute" VARCHAR(50),
    "effect_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,

    CONSTRAINT "game_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endings" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "EndingType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "endings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_configs" (
    "id" SERIAL NOT NULL,
    "min_level" INTEGER NOT NULL,
    "max_level" INTEGER NOT NULL,
    "min_power_req" INTEGER NOT NULL,
    "max_power_req" INTEGER NOT NULL,
    "min_gold_reward" INTEGER NOT NULL,
    "max_gold_reward" INTEGER NOT NULL,
    "min_customers" INTEGER NOT NULL DEFAULT 1,
    "max_customers" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "quest_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_rewards" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "level_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "condition_type" VARCHAR(50) NOT NULL,
    "condition_value" INTEGER NOT NULL DEFAULT 0,
    "reward_crew_id" INTEGER,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "achieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "starter_perks" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "effect_type" VARCHAR(50) NOT NULL,
    "effect_value" DOUBLE PRECISION NOT NULL,
    "unlock_condition" VARCHAR(100),
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "starter_perks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_inventory_user_id_card_id_key" ON "user_inventory"("user_id", "card_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_endings_user_id_ending_id_key" ON "user_endings"("user_id", "ending_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "starter_perks_code_key" ON "starter_perks"("code");

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_quests" ADD CONSTRAINT "daily_quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_quests" ADD CONSTRAINT "daily_quests_boss_config_id_fkey" FOREIGN KEY ("boss_config_id") REFERENCES "boss_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_active_events" ADD CONSTRAINT "user_active_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_active_events" ADD CONSTRAINT "user_active_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "game_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_endings" ADD CONSTRAINT "user_endings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_endings" ADD CONSTRAINT "user_endings_ending_id_fkey" FOREIGN KEY ("ending_id") REFERENCES "endings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_effects" ADD CONSTRAINT "card_effects_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_combos" ADD CONSTRAINT "card_combos_card_id_1_fkey" FOREIGN KEY ("card_id_1") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_combos" ADD CONSTRAINT "card_combos_card_id_2_fkey" FOREIGN KEY ("card_id_2") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_rewards" ADD CONSTRAINT "level_rewards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_reward_crew_id_fkey" FOREIGN KEY ("reward_crew_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
