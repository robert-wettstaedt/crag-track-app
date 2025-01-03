import type { EDIT_PERMISSION, READ_PERMISSION } from '$lib/auth'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<{
        session: Session | null
        user: User | null
        userRole: string | undefined
        userPermissions: Array<typeof READ_PERMISSION | typeof EDIT_PERMISSION> | undefined
      }>
      session: Session | null
      user: User | null
      userRole: string | undefined
      userPermissions: Array<typeof READ_PERMISSION | typeof EDIT_PERMISSION> | undefined
    }
    interface PageData {
      session: Session | null
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
