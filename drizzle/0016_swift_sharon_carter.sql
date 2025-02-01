CREATE INDEX IF NOT EXISTS "areas_description_idx" ON "areas" USING btree ("description");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ascents_notes_idx" ON "ascents" USING btree ("notes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_description_idx" ON "routes" USING btree ("description");