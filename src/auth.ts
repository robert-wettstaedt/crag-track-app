import { NEXTCLOUD_ID, NEXTCLOUD_SECRET, NEXTCLOUD_URL } from '$env/static/private'
import { PUBLIC_DEMO_MODE } from '$env/static/public'
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

let auth: ReturnType<typeof SvelteKitAuth>

if (PUBLIC_DEMO_MODE) {
  auth = {
    handle: ({ event, resolve }) => {
      event.locals.auth ??= async () => {
        return {
          user: {
            email: 'demo@crag-track.com',
            id: '1',
            name: 'demo_user',
          },
          expires: '',
        }
      }

      return resolve(event)
    },
    signIn: () => {},
    signOut: () => {},
  }
} else {
  auth = SvelteKitAuth({
    providers: [nextcloudProvider],
    secret: NEXTCLOUD_SECRET,
    trustHost: true,
    callbacks: {
      async session({ session, token }) {
        return {
          ...session,
          accessToken: token.accessToken as string,
          error: token.error as string,
          expiresAt: token.expiresAt as number,
          refreshToken: token.refreshToken as string,
        }
      },
      async jwt({ account, token }) {
        // If account is available, add its tokens to the JWT
        if (account != null) {
          return {
            ...token,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
          }
        }

        // If the current token is still valid, return it
        if (Date.now() < (token.expiresAt as number) * 1000) {
          return token
        }

        try {
          // Prepare the parameters for the token refresh request
          const searchParams = new URLSearchParams({
            client_id: nextcloudProvider.clientId!,
            client_secret: nextcloudProvider.clientSecret!,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
          })

          // Make the request to refresh the token
          const response = await fetch(`${nextcloudProvider.token}?${searchParams.toString()}`, { method: 'POST' })

          // Parse the response to get the new tokens
          const tokens: Account = await response.json()

          // If the response is not OK or tokens are invalid, throw an error
          if (!response.ok || tokens.expires_in == null) {
            throw tokens
          }

          // Return the new token data, keeping previous properties
          return {
            ...token, // Keep the previous token properties
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
            // Fall back to old refresh token, but note that
            // many providers may only allow using a refresh token once.
            refreshToken: tokens.refresh_token ?? token.refresh_token,
          }
        } catch (exception) {
          console.error('Error refreshing access token', exception)
          // The error property will be used client-side to handle the refresh token error
          return { ...token, error: 'RefreshAccessTokenError' as const }
        }
      },
    },
  })
}

export const { handle, signIn, signOut } = auth
