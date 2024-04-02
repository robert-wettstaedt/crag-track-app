import '@auth/sveltekit'

declare module '@auth/sveltekit' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string
  }
}
