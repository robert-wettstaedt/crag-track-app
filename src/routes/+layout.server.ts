import { db } from '$lib/db/db.server'
import { users, type User } from '$lib/db/schema'
import { eq } from 'drizzle-orm'
import type { LayoutServerLoad } from './$types'

//    nextcloud = createClient(NEXTCLOUD_URL + '/remote.php/dav/files/' + session.user.email, {
//      authType: AuthType.Token,
//      token: {
//        access_token: token.accessToken,
//        token_type: 'Bearer',
//      },
//    })

export const load: LayoutServerLoad = async (event) => {
  const session = await event.locals.auth()

  let user: User | undefined

  if (session?.user.email != null && session.user.name != null) {
    user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (user == null) {
      const result = await db
        .insert(users)
        .values({ email: session.user.email, userName: session.user.name })
        .returning()
      user = result.at(0)
    }
  }

  return {
    session,
    user,
  }
}
