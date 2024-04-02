import '@auth/sveltekit'

declare module '@auth/sveltekit' {
  interface Session {
    accessToken?: string
    error?: 'RefreshAccessTokenError'
    expiresAt?: number
    refreshToken?: string
  }
}
