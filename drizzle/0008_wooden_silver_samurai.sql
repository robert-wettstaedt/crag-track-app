CREATE TABLE IF NOT EXISTS "first_ascensionists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_fk" integer
);
--> statement-breakpoint
ALTER TABLE "first_ascensionists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "routes_to_first_ascensionists" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_fk" integer NOT NULL,
	"first_ascensionist_fk" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routes_to_first_ascensionists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "first_ascent_year" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_ascentionist_fk" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes_to_first_ascensionists" ADD CONSTRAINT "routes_to_first_ascensionists_route_fk_routes_id_fk" FOREIGN KEY ("route_fk") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes_to_first_ascensionists" ADD CONSTRAINT "routes_to_first_ascensionists_first_ascensionist_fk_first_ascensionists_id_fk" FOREIGN KEY ("first_ascensionist_fk") REFERENCES "public"."first_ascensionists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "first_ascensionists_user_fk_idx" ON "first_ascensionists" USING btree ("user_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "first_ascensionists_name_idx" ON "first_ascensionists" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_to_first_ascensionists_route_fk_idx" ON "routes_to_first_ascensionists" USING btree ("route_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_to_first_ascensionists_first_ascensionist_fk_idx" ON "routes_to_first_ascensionists" USING btree ("first_ascensionist_fk");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_first_ascentionist_fk_idx" ON "users" USING btree ("first_ascentionist_fk");--> statement-breakpoint
CREATE POLICY "users can update own users" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT auth.uid()) = auth_user_fk) WITH CHECK ((SELECT auth.uid()) = auth_user_fk);--> statement-breakpoint
CREATE POLICY "data.read can fully access first_ascensionists" ON "first_ascensionists" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.read'))) WITH CHECK ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.read can fully access routes_to_first_ascensionists" ON "routes_to_first_ascensionists" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.read'))) WITH CHECK ((SELECT authorize('data.read')));