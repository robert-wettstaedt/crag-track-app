import { DATABASE_URL } from '$env/static/private'
import { decodeToken, type SupabaseToken } from '$lib/auth'
import KeyvPostgres from '@keyv/postgres'
import { type SupabaseClient } from '@supabase/supabase-js'
import { sql } from 'drizzle-orm'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import Keyv from 'keyv'
import Database from 'postgres'
import * as schema from './schema'

const postgres = Database(DATABASE_URL, { debug: true, prepare: false })
export const db = drizzle(postgres, { schema })

const keyvPostgres = new KeyvPostgres({ uri: DATABASE_URL, pool: false })
export const keyv = new Keyv({ store: keyvPostgres, ttl: 1000 * 60 * 60 })

export function createDrizzle<
  Database extends PostgresJsDatabase<typeof schema>,
  Token extends SupabaseToken = SupabaseToken,
>(token: Token, db: Database) {
  return (async (transaction, ...rest) => {
    return await db.transaction(
      async (tx) => {
        // Supabase exposes auth.uid() and auth.jwt()
        // https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions
        try {
          await tx.execute(sql`
          -- auth.jwt()
          select set_config('request.jwt.claims', '${sql.raw(JSON.stringify(token))}', TRUE);
          -- auth.uid()
          select set_config('request.jwt.claim.sub', '${sql.raw(token.sub ?? '')}', TRUE);
          -- set local role
          set local role ${sql.raw(token.role ?? 'anon')};
          `)
          return await transaction(tx)
        } finally {
          await tx.execute(sql`
            -- reset
            select set_config('request.jwt.claims', NULL, TRUE);
            select set_config('request.jwt.claim.sub', NULL, TRUE);
            reset role;
            `)
        }
      },
      ...rest,
    )
  }) as typeof db.transaction
}

// https://github.com/orgs/supabase/discussions/23224
// Should be secure because we use the access token that is signed, and not the data read directly from the storage
export async function createDrizzleSupabaseClient(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return createDrizzle(decodeToken(session?.access_token ?? ''), db)
}
