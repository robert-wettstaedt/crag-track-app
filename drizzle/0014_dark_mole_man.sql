DROP POLICY "Authenticated users can read activities" ON "activities" CASCADE;--> statement-breakpoint
DROP POLICY "Users can create activities" ON "activities" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access areas" ON "areas" CASCADE;--> statement-breakpoint
DROP POLICY "data.read can create ascents" ON "ascents" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access ascents" ON "ascents" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access blocks" ON "blocks" CASCADE;--> statement-breakpoint
DROP POLICY "data.read can create files" ON "files" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access files" ON "files" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access geolocations" ON "geolocations" CASCADE;--> statement-breakpoint
DROP POLICY "data.read can create geolocations" ON "geolocations" CASCADE;--> statement-breakpoint
DROP POLICY "Authenticated users can fully access grades" ON "grades" CASCADE;--> statement-breakpoint
DROP POLICY "Authenticated users can read role_permissions" ON "role_permissions" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access route_external_resource_27crags" ON "route_external_resource_27crags" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access route_external_resource_8a" ON "route_external_resource_8a" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access route_external_resource_the_crag" ON "route_external_resource_the_crag" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access route_external_resources" ON "route_external_resources" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access routes" ON "routes" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access routes_to_tags" ON "routes_to_tags" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access tags" ON "tags" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access topo_routes" ON "topo_routes" CASCADE;--> statement-breakpoint
DROP POLICY "data.edit can fully access topos" ON "topos" CASCADE;--> statement-breakpoint
DROP POLICY "users can create own users_settings" ON "user_settings" CASCADE;--> statement-breakpoint
CREATE POLICY "authenticated users can read activities" ON "activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "users can insert activities" ON "activities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "data.edit can insert areas" ON "areas" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update areas" ON "areas" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete areas" ON "areas" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.read can insert ascents" ON "ascents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can update ascents" ON "ascents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete ascents" ON "ascents" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert blocks" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update blocks" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete blocks" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.read can insert files" ON "files" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can update files" ON "files" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete files" ON "files" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert geolocations" ON "geolocations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update geolocations" ON "geolocations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete geolocations" ON "geolocations" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.read can insert geolocations" ON "geolocations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "authenticated users can fully access grades" ON "grades" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "authenticated users can read role_permissions" ON "role_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "data.edit can insert route_external_resource_27crags" ON "route_external_resource_27crags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update route_external_resource_27crags" ON "route_external_resource_27crags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete route_external_resource_27crags" ON "route_external_resource_27crags" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert route_external_resource_8a" ON "route_external_resource_8a" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update route_external_resource_8a" ON "route_external_resource_8a" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete route_external_resource_8a" ON "route_external_resource_8a" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert route_external_resource_the_crag" ON "route_external_resource_the_crag" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update route_external_resource_the_crag" ON "route_external_resource_the_crag" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete route_external_resource_the_crag" ON "route_external_resource_the_crag" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert route_external_resources" ON "route_external_resources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update route_external_resources" ON "route_external_resources" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete route_external_resources" ON "route_external_resources" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert routes" ON "routes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update routes" ON "routes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete routes" ON "routes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert routes_to_tags" ON "routes_to_tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update routes_to_tags" ON "routes_to_tags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete routes_to_tags" ON "routes_to_tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert tags" ON "tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update tags" ON "tags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete tags" ON "tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert topo_routes" ON "topo_routes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update topo_routes" ON "topo_routes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete topo_routes" ON "topo_routes" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "data.edit can insert topos" ON "topos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.edit can update topos" ON "topos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.delete can delete topos" ON "topos" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((SELECT authorize('data.delete')));--> statement-breakpoint
CREATE POLICY "users can insert own users_settings" ON "user_settings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT auth.uid()) = auth_user_fk);