import { jwtDecode, type JwtPayload } from 'jwt-decode'

export const READ_PERMISSION = 'data.read'
export const EDIT_PERMISSION = 'data.edit'

export interface SupabaseToken extends JwtPayload {
  iss?: string
  sub?: string
  aud?: string[] | string
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  role?: string

  user_role?: string
  user_permissions?: Array<typeof READ_PERMISSION | typeof EDIT_PERMISSION>
}

export function decodeToken(accessToken: string): SupabaseToken {
  try {
    return jwtDecode<SupabaseToken>(accessToken)
  } catch (error) {
    return { role: 'anon' } as SupabaseToken
  }
}
