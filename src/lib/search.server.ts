import { db } from '$lib/db/db.server'
import type { User } from '$lib/db/schema'
import * as schema from '$lib/db/schema'
import type { EnrichedArea, EnrichedBlock, EnrichedRoute } from '$lib/db/utils'
import { buildNestedAreaQuery, enrichArea, enrichBlock, enrichRoute } from '$lib/db/utils'
import { eq, like, or } from 'drizzle-orm'

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
): Promise<SearchedResources> => {
  // If the query is null or less than 3 characters, return early
  if (query == null || query.length < 3) {
    throw new Error('Query must be at least 3 characters')
  }

  // Prepare the search string for SQL LIKE queries
  const searchString = `%${query}%`

  // Query the database for areas matching the search string
  const areasResult = await db.query.areas.findMany({
    where: like(schema.areas.name, searchString),
    with: {
      parent: buildNestedAreaQuery(), // Include nested parent area information
    },
  })

  // Query the database for blocks matching the search string
  const blocksResult = await db.query.blocks.findMany({
    where: like(schema.blocks.name, searchString),
    with: {
      area: buildNestedAreaQuery(), // Include nested area information
      geolocation: true,
    },
  })

  // Query the database for routes matching the search string
  const routesResult = await db.query.routes.findMany({
    where: like(schema.routes.name, searchString),
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
    where: or(like(schema.users.email, searchString), like(schema.users.userName, searchString)),
  })

  return {
    searchResults: {
      routes: routesResult.map((route) => enrichRoute(route)), // Enrich routes with additional data
      blocks: blocksResult.map(enrichBlock), // Enrich blocks with additional data
      areas: areasResult.map(enrichArea), // Enrich areas with additional data
      users: usersResult, // Return users as is
    },
  }
}
