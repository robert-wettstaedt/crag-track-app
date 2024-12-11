import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import { decodeToken } from '$lib/auth'
import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import type { UserWithPermissions } from '../../app'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  /**
   * Declare a dependency so the layout can be invalidated, for example, on
   * session refresh.
   */
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
      })
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return data.cookies
          },
        },
      })

  /**
   * It's fine to use `getSession` here, because on the client, `getSession` is
   * safe, and on the server, it reads `session` from the `LayoutData`, which
   * safely checked the session using `safeGetSession`.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { user_permissions, user_role } = decodeToken(session?.access_token ?? '')

  const authUserWithClaims: UserWithPermissions | null =
    user == null
      ? null
      : {
          ...user,
          appRole: user_role,
          appPermissions: user_permissions,
        }

  return { grades: data.grades, session, supabase, authUser: authUserWithClaims, user: data.user }
}
