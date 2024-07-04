import { db } from '$lib/db/db.server'
import { areas, blocks } from '$lib/db/schema'
import { buildNestedAreaQuery, enrichBlock } from '$lib/db/utils'
import { convertAreaSlug } from '$lib/helper.server'
import { error } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'

const blocksQuery: {
  area: Parameters<typeof db.query.areas.findMany>[0]
  geolocation: true
} = {
  area: buildNestedAreaQuery(2),
  geolocation: true,
}

export async function GET({ params }) {
  const { areaId } = convertAreaSlug(params)

  const areasResult = await db.query.areas.findMany({
    where: eq(areas.id, areaId),
    with: {
      author: true,
      blocks: {
        orderBy: blocks.name,
        with: blocksQuery,
      },
      areas: {
        orderBy: areas.name,
        with: {
          blocks: {
            orderBy: blocks.name,
            with: blocksQuery,
          },
        },
      },
      parkingLocations: true,
    },
  })

  // Get the last area from the result
  const area = areasResult.at(-1)

  // If no area is found, throw a 404 error
  if (area == null) {
    error(404)
  }

  const allBlocks = [...area.blocks, ...area.areas.flatMap((area) => area.blocks)]

  const enrichedBlocks = await Promise.all(
    allBlocks
      .filter((block) => block.geolocation != null)
      .map(async (block) => {
        const enrichedBlock = enrichBlock(block)

        return {
          ...block,
          ...enrichedBlock,
        }
      }),
  )

  const xml = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
  <gpx
    version="1.1"
    creator="OsmAnd~ 4.7.10"
    xmlns="http://www.topografix.com/GPX/1/1"
    xmlns:osmand="https://osmand.net"
    xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
      <metadata>
        <name>${area.name.replaceAll(/&/g, '&amp;').replaceAll(/>/g, '&gt;').replaceAll(/</g, '&lt;').replaceAll(/"/g, '&quot;')}</name>
        <author>
          <name>${area.author.userName}</name>
          <email>${area.author.email}</email>
        </author>
        <copyright>
          <year>${new Date().getFullYear()}</year>
          <license>
            <href>https://creativecommons.org/licenses/by-nc-sa/4.0/</href>
          </license>
        </copyright>
      </metadata>


  ${enrichedBlocks
    .map(
      (block) => `
    <wpt lat="${block.geolocation!.lat}" lon="${block.geolocation!.long}">
      <time>${DateTime.fromSQL(block.createdAt).toISO()}</time>
      <name>${block.name.replaceAll(/&/g, '&amp;').replaceAll(/>/g, '&gt;').replaceAll(/</g, '&lt;').replaceAll(/"/g, '&quot;')}</name>
      <extensions>
        <osmand:color>#a71de1</osmand:color>
        <osmand:background>circle</osmand:background>
        <osmand:icon>sport_climbing</osmand:icon>
      </extensions>
    </wpt>`,
    )
    .join('')}

    ${area.parkingLocations
      .map(
        (parkingLocation, index) => `
    <wpt lat="${parkingLocation.lat}" lon="${parkingLocation.long}">
      <time>${DateTime.fromSQL(area.createdAt).toISO()}</time>
      <name>Parking${area.parkingLocations.length > 1 ? ` ${index + 1}` : ''}</name>
      <extensions>
        <osmand:color>#a71de1</osmand:color>
        <osmand:background>circle</osmand:background>
        <osmand:icon>amenity_parking</osmand:icon>
      </extensions>
    </wpt>`,
      )
      .join('')}
  </gpx>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
