ALTER TABLE "user_roles" RENAME COLUMN "user_fk" TO "auth_user_fk";--> statement-breakpoint
DROP POLICY "Allow auth admin to read role_permissions" ON "role_permissions" CASCADE;--> statement-breakpoint
DROP POLICY "Allow auth admin to read user_roles" ON "user_roles" CASCADE;--> statement-breakpoint
CREATE POLICY "Authenticated users can read role_permissions" ON "role_permissions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "auth admins can read user_roles" ON "user_roles" AS PERMISSIVE FOR SELECT TO "supabase_auth_admin" USING (true);--> statement-breakpoint
CREATE POLICY "users can read own user_roles" ON "user_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT auth.uid()) = auth_user_fk);