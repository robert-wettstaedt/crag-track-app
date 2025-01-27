DROP POLICY "data.read can read first_ascents" ON "first_ascents" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access first_ascents" ON "first_ascents" CASCADE;--> statement-breakpoint
DROP TABLE "first_ascents" CASCADE;--> statement-breakpoint
ALTER TABLE "routes" DROP COLUMN IF EXISTS "first_ascent_fk";