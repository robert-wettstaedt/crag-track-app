ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Allow auth admin to read role permissions" ON "role_permissions" AS PERMISSIVE FOR SELECT TO "supabase_auth_admin" USING (true);