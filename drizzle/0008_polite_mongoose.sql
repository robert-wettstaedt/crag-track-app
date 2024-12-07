DROP POLICY "data.read can read areas" ON "ascents" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access areas" ON "ascents" CASCADE;--> statement-breakpoint
CREATE POLICY "data.read can create ascents" ON "ascents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.read can read ascents" ON "ascents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access ascents" ON "ascents" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));