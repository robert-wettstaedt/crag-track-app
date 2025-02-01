import type { User } from '$lib/db/schema'
import * as schema from '$lib/db/schema'
import type { NestedBlock } from '$lib/db/types'
import type { EnrichedArea, EnrichedBlock, EnrichedRoute } from '$lib/db/utils'
import { buildNestedAreaQuery, enrichArea, enrichBlock, enrichRoute } from '$lib/db/utils'
import { eq, ilike } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

export interface SearchResults {
  routes: EnrichedRoute[]
  blocks: EnrichedBlock[]
  areas: EnrichedArea[]
  users: User[]
}

export interface SearchedResources {
  searchResults: SearchResults
}

export const searchResources = async (
  query: string | null | undefined,
  user: schema.User | undefined,
  db: PostgresJsDatabase<typeof schema>,
): Promise<SearchedResources> => {
  // If the query is null or less than 3 characters, return early
  if (query == null || query.length < 3) {
    throw new Error('Query must be at least 3 characters')
  }

  // Prepare the search string for SQL LIKE queries
  const searchString = `%${query}%`

  // Query the database for areas matching the search string
  const areasResult = await db.query.areas.findMany({
    where: ilike(schema.areas.name, searchString),
    with: {
      parent: buildNestedAreaQuery(), // Include nested parent area information
    },
  })

  // Query the database for blocks matching the search string
  const blocksResult = await db.query.blocks.findMany({
    where: ilike(schema.blocks.name, searchString),
    with: {
      area: buildNestedAreaQuery(), // Include nested area information
      geolocation: true,
    },
  })

  // Query the database for routes matching the search string
  const routesResult = await db.query.routes.findMany({
    where: ilike(schema.routes.name, searchString),
    with: {
      ascents: user == null ? { limit: 0 } : { where: eq(schema.ascents.createdBy, user.id) },
      block: {
        with: {
          area: buildNestedAreaQuery(), // Include nested block and area information
        },
      },
    },
  })

  // Query the database for users matching the search string in email or username
  const usersResult = await db.query.users.findMany({
    where: ilike(schema.users.username, searchString),
  })

  return {
    searchResults: {
      routes: routesResult.map((route) => enrichRoute(route)), // Enrich routes with additional data
      blocks: blocksResult.map((block) => enrichBlock(block as NestedBlock)), // Enrich blocks with additional data
      areas: areasResult.map(enrichArea), // Enrich areas with additional data
      users: usersResult, // Return users as is
    },
  }
}
