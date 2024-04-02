import { NEXTCLOUD_ID, NEXTCLOUD_SECRET, NEXTCLOUD_URL } from '$env/static/private'
import { SvelteKitAuth } from '@auth/sveltekit'

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    {
      id: 'nextcloud',
      name: 'Nextcloud',
      type: 'oauth',

      authorization: `${NEXTCLOUD_URL}/apps/oauth2/authorize`,
      token: `${NEXTCLOUD_URL}/apps/oauth2/api/v1/token`,
      userinfo: `${NEXTCLOUD_URL}/ocs/v2.php/cloud/user?format=json`,
      issuer: NEXTCLOUD_URL,

      clientId: NEXTCLOUD_ID,
      clientSecret: NEXTCLOUD_SECRET,

      profile: (profile, token) => {
        return {
          email: profile.ocs.data.email,
          name: profile.ocs.data.displayname,
          token: token.access_token,
        }
      },
    },
  ],
  secret: NEXTCLOUD_SECRET,
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.id as string,
        },
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
})
