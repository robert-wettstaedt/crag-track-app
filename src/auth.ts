import { NEXTCLOUD_ID, NEXTCLOUD_SECRET, NEXTCLOUD_URL } from '$env/static/private'
import { SvelteKitAuth, type Account } from '@auth/sveltekit'
import type { Provider } from '@auth/sveltekit/providers'

const nextcloudProvider: Provider = {
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
}

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [nextcloudProvider],
  secret: NEXTCLOUD_SECRET,
  callbacks: {
    async session(params) {
      console.log('session', params)

      const { session, token } = params

      return {
        ...session,
        accessToken: token.accessToken as string,
        error: token.error as string,
        expiresAt: token.expiresAt as number,
        refreshToken: token.refreshToken as string,
      }
    },
    async jwt(params) {
      const { token, account } = params
      console.log('jwt', params)

      if (account != null) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        }
      }

      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      console.log('Token expired, refreshing...')

      try {
        const searchParams = new URLSearchParams({
          client_id: nextcloudProvider.clientId!,
          client_secret: nextcloudProvider.clientSecret!,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken as string,
        })

        const response = await fetch(`${nextcloudProvider.token}?${searchParams.toString()}`, { method: 'POST' })

        const tokens: Account = await response.json()

        if (!response.ok || tokens.expires_in == null) {
          throw tokens
        }

        console.log('New token:', tokens)

        return {
          ...token, // Keep the previous token properties
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          // Fall back to old refresh token, but note that
          // many providers may only allow using a refresh token once.
          refreshToken: tokens.refresh_token ?? token.refresh_token,
        }
      } catch (error) {
        console.error('Error refreshing access token', error)
        // The error property will be used client-side to handle the refresh token error
        return { ...token, error: 'RefreshAccessTokenError' as const }
      }
    },
  },
})
