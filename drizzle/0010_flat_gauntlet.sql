CREATE POLICY "data.read can delete their own ascents" ON "ascents" AS PERMISSIVE FOR DELETE TO "authenticated" USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = created_by AND u.auth_user_fk = (SELECT auth.uid())));