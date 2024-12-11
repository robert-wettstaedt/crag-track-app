CREATE TYPE "public"."app_permission" AS ENUM('data.read', 'data.edit');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('user', 'maintainer');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "areas" (
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'area' NOT NULL,
	"parent_fk" integer
);
--> statement-breakpoint
ALTER TABLE "areas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ascents" (
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"date_time" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"notes" text,
	"type" text NOT NULL,
	"grade_fk" integer,
	"route_fk" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ascents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blocks" (
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"area_fk" integer NOT NULL,
	"geolocation_fk" integer
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"type" text NOT NULL,
	"area_fk" integer,
	"ascent_fk" integer,
	"route_fk" integer,
	"block_fk" integer
);
--> statement-breakpoint
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "first_ascents" (
	"id" serial PRIMARY KEY NOT NULL,
	"climber_name" text,
	"year" integer,
	"route_fk" integer NOT NULL,
	"climber_fk" integer
);
--> statement-breakpoint
ALTER TABLE "first_ascents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geolocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lat" real NOT NULL,
	"long" real NOT NULL,
	"area_fk" integer,
	"block_fk" integer
);
--> statement-breakpoint
ALTER TABLE "geolocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"FB" text,
	"V" text
);
--> statement-breakpoint
ALTER TABLE "grades" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "app_role" NOT NULL,
	"permission" "app_permission" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_external_resource_27crags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"searchable_id" integer,
	"searchable_type" text,
	"country_name" text,
	"location_name" text,
	"description" text,
	"crag_id" integer,
	"latitude" real,
	"longitude" real,
	"path" text,
	"url" text,
	"external_resources_fk" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "route_external_resource_27crags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_external_resource_8a" (
	"id" serial PRIMARY KEY NOT NULL,
	"zlaggable_name" text,
	"zlaggable_slug" text,
	"zlaggable_id" integer,
	"crag_name" text,
	"crag_slug" text,
	"country_slug" text,
	"country_name" text,
	"area_name" text,
	"area_slug" text,
	"sector_name" text,
	"sector_slug" text,
	"grade_index" integer,
	"type" integer,
	"category" integer,
	"average_rating" real,
	"difficulty" text,
	"url" text,
	"external_resources_fk" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "route_external_resource_8a" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_external_resource_the_crag" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"grade" text,
	"node" bigint,
	"rating" integer,
	"tags" text,
	"url" text,
	"external_resources_fk" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "route_external_resource_the_crag" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_external_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_fk" integer NOT NULL,
	"external_resource_8a_fk" integer,
	"external_resource_27crags_fk" integer,
	"external_resource_the_crag_fk" integer
);
--> statement-breakpoint
ALTER TABLE "route_external_resources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "routes" (
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"rating" integer,
	"block_fk" integer NOT NULL,
	"first_ascent_fk" integer,
	"external_resources_fk" integer,
	"grade_fk" integer
);
--> statement-breakpoint
ALTER TABLE "routes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "routes_to_tags" (
	"route_fk" integer NOT NULL,
	"tag_fk" text NOT NULL,
	CONSTRAINT "routes_to_tags_route_fk_tag_fk_pk" PRIMARY KEY("route_fk","tag_fk")
);
--> statement-breakpoint
ALTER TABLE "routes_to_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topo_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"top_type" text NOT NULL,
	"path" text,
	"route_fk" integer,
	"topo_fk" integer
);
--> statement-breakpoint
ALTER TABLE "topo_routes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topos" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_fk" integer,
	"file_fk" integer
);
--> statement-breakpoint
ALTER TABLE "topos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_fk" uuid NOT NULL,
	"role" "app_role" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_fk" uuid NOT NULL,
	"user_fk" integer NOT NULL,
	"cookie_8a" text,
	"cookie_27crags" text,
	"cookie_the_crag" text,
	"grading_scale" text DEFAULT 'FB' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"created_at" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"auth_user_fk" uuid NOT NULL,
	"user_settings_fk" integer
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "areas" ADD CONSTRAINT "areas_parent_fk_areas_id_fk" FOREIGN KEY ("parent_fk") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes_to_tags" ADD CONSTRAINT "routes_to_tags_route_fk_routes_id_fk" FOREIGN KEY ("route_fk") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes_to_tags" ADD CONSTRAINT "routes_to_tags_tag_fk_tags_id_fk" FOREIGN KEY ("tag_fk") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE POLICY "data.read can read areas" ON "areas" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access areas" ON "areas" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can create ascents" ON "ascents" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.read can read ascents" ON "ascents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.read can update their own ascents" ON "ascents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
          EXISTS (
            SELECT
              1
            FROM
              public.users u
            WHERE
              u.id = created_by
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        );--> statement-breakpoint
CREATE POLICY "data.read can delete their own ascents" ON "ascents" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
          EXISTS (
            SELECT
              1
            FROM
              public.users u
            WHERE
              u.id = created_by
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        );--> statement-breakpoint
CREATE POLICY "data.edit can fully access ascents" ON "ascents" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read blocks" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access blocks" ON "blocks" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can create files" ON "files" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.read can read files" ON "files" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.read can update files belonging to their own ascents" ON "files" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
          EXISTS (
            SELECT
              1
            FROM
              public.ascents a
              JOIN public.users u ON a.created_by = u.id
            WHERE
              a.id = ascent_fk
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        );--> statement-breakpoint
CREATE POLICY "data.read can delete files belonging to their own ascents" ON "files" AS PERMISSIVE FOR DELETE TO "authenticated" USING (
          EXISTS (
            SELECT
              1
            FROM
              public.ascents a
              JOIN public.users u ON a.created_by = u.id
            WHERE
              a.id = ascent_fk
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        );--> statement-breakpoint
CREATE POLICY "data.edit can fully access files" ON "files" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read first_ascents" ON "first_ascents" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access first_ascents" ON "first_ascents" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read geolocations" ON "geolocations" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access geolocations" ON "geolocations" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "Authenticated users can fully access grades" ON "grades" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow auth admin to read role_permissions" ON "role_permissions" AS PERMISSIVE FOR SELECT TO "supabase_auth_admin" USING (true);--> statement-breakpoint
CREATE POLICY "data.read can read route_external_resource_27crags" ON "route_external_resource_27crags" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access route_external_resource_27crags" ON "route_external_resource_27crags" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read route_external_resource_8a" ON "route_external_resource_8a" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access route_external_resource_8a" ON "route_external_resource_8a" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read route_external_resource_the_crag" ON "route_external_resource_the_crag" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access route_external_resource_the_crag" ON "route_external_resource_the_crag" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read route_external_resources" ON "route_external_resources" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access route_external_resources" ON "route_external_resources" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read routes" ON "routes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access routes" ON "routes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read routes_to_tags" ON "routes_to_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access routes_to_tags" ON "routes_to_tags" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read tags" ON "tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access tags" ON "tags" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read topo_routes" ON "topo_routes" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access topo_routes" ON "topo_routes" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "data.read can read topos" ON "topos" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));--> statement-breakpoint
CREATE POLICY "data.edit can fully access topos" ON "topos" AS PERMISSIVE FOR ALL TO "authenticated" USING ((SELECT authorize('data.edit'))) WITH CHECK ((SELECT authorize('data.edit')));--> statement-breakpoint
CREATE POLICY "Allow auth admin to read user_roles" ON "user_roles" AS PERMISSIVE FOR SELECT TO "supabase_auth_admin" USING (true);--> statement-breakpoint
CREATE POLICY "users can create own users_settings" ON "user_settings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((SELECT auth.uid()) = auth_user_fk);--> statement-breakpoint
CREATE POLICY "users can read own users_settings" ON "user_settings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT auth.uid()) = auth_user_fk);--> statement-breakpoint
CREATE POLICY "users can update own users_settings" ON "user_settings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((SELECT auth.uid()) = auth_user_fk);--> statement-breakpoint
CREATE POLICY "data.read can read users" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));