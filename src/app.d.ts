import type { SupabaseToken } from '$lib/auth'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

export interface UserWithPermissions extends User {
  appRole: SupabaseToken['user_role']
  appPermissions: SupabaseToken['user_permissions']
}

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      session: Session | null
      user: UserWithPermissions | null
    }
    interface PageData {
      session: Session | null
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
