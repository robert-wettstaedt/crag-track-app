import { DefaultSession } from '@auth/sveltekit'

declare module '@auth/sveltekit' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** Oauth access token */
      token?: accessToken
    } & DefaultSession['user']
  }
}
