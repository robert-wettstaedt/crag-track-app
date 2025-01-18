CREATE TYPE "public"."activity_type" AS ENUM('created', 'updated', 'deleted', 'uploaded');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activities" (
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"type" "activity_type" NOT NULL,
	"user_fk" integer NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"parent_entity_id" integer,
	"parent_entity_type" text,
	"column_name" text,
	"metadata" text,
	"old_value" text,
	"new_value" text
);
--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_created_at_idx" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_type_idx" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_user_fk_idx" ON "activities" USING btree ("user_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_entity_id_idx" ON "activities" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_entity_type_idx" ON "activities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_parent_entity_id_idx" ON "activities" USING btree ("parent_entity_id");--> statement-breakpoint
CREATE POLICY "Authenticated users can read activities" ON "activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can create activities" ON "activities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);