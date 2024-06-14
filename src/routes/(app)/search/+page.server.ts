import { db } from '$lib/db/db.server'
import { like, or } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { areas, routes, blocks, users } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichArea, enrichRoute, enrichBlock } from '$lib/db/utils'

export const load = (async ({ url }) => {
  // Get the search query parameter from the URL
  const query = url.searchParams.get('q')

  // If the query is null or less than 3 characters, return early
  if (query == null || query.length < 3) {
    return
  }

  // Prepare the search string for SQL LIKE queries
  const searchString = `%${query}%`

  // Query the database for areas matching the search string
  const areasResult = await db.query.areas.findMany({
    where: like(areas.name, searchString),
    with: {
      parent: buildNestedAreaQuery(), // Include nested parent area information
    },
  })

  // Query the database for blocks matching the search string
  const blocksResult = await db.query.blocks.findMany({
    where: like(blocks.name, searchString),
    with: {
      area: buildNestedAreaQuery(), // Include nested area information
    },
  })

  // Query the database for routes matching the search string
  const routesResult = await db.query.routes.findMany({
    where: like(routes.name, searchString),
    with: {
      block: {
        with: {
          area: buildNestedAreaQuery(), // Include nested block and area information
        },
      },
    },
  })

  // Query the database for users matching the search string in email or username
  const usersResult = await db.query.users.findMany({
    where: or(like(users.email, searchString), like(users.userName, searchString)),
  })

  // Return the search results after enriching them with additional data
  return {
    searchResults: {
      routes: routesResult.map(enrichRoute), // Enrich routes with additional data
      blocks: blocksResult.map(enrichBlock), // Enrich blocks with additional data
      areas: areasResult.map(enrichArea), // Enrich areas with additional data
      users: usersResult, // Return users as is
    },
  }
}) satisfies PageServerLoad
