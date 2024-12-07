CREATE POLICY "data.read can read areas" ON "areas" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((SELECT authorize('data.read')));