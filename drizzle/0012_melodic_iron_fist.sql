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
ALTER POLICY "data.read can update their own ascents" ON "ascents" TO authenticated USING (
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
ALTER POLICY "data.read can delete their own ascents" ON "ascents" TO authenticated USING (
          EXISTS (
            SELECT
              1
            FROM
              public.users u
            WHERE
              u.id = created_by
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        );