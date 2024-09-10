import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { encode } from 'html-entities'
import { DateTime } from 'luxon'
import stringToColor from 'string-to-color'
import { getBlocksOfArea } from './blocks.server'
import * as schema from './db/schema'

export const getAreaGPX = async (areaId: number, db: BetterSQLite3Database<typeof schema>) => {
  const { area, blocks } = await getBlocksOfArea(areaId, db)
  const parkingLocations = [...area.parkingLocations, ...area.areas.flatMap((area) => area.parkingLocations)]

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
        <name>${encode(area.name)}</name>
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


  ${blocks
    .map((block) => {
      const color = stringToColor(block.area.type === 'crag' ? block.area.id : block.area.parentFk)

      return `
    <wpt lat="${block.geolocation!.lat}" lon="${block.geolocation!.long}">
      <time>${DateTime.fromSQL(block.createdAt).toISO()}</time>
      <name>${encode(block.area.parent.name)} / ${encode(block.area.name)} / ${encode(block.name)}</name>
      <desc>${encode(
        block.routes
          .map((route) =>
            [
              route.name.length === 0 ? '* ?' : `* ${route.name}`,
              route.grade == null ? null : `${route.gradingScale} ${route.grade}`,
              route.description,
            ]
              .filter(Boolean)
              .join(' - '),
          )
          .join('\n\n'),
      )}</desc>
      <extensions>
        <osmand:color>${color}</osmand:color>
        <osmand:background>circle</osmand:background>
        <osmand:icon>natural_peak</osmand:icon>
      </extensions>
    </wpt>

    ${block.routes
      .map((route) => {
        const routeName = [
          route.name.length === 0 ? '?' : route.name,
          route.grade == null ? null : `${route.gradingScale} ${route.grade}`,
        ]
          .filter(Boolean)
          .join(' - ')

        return `
    <wpt lat="${block.geolocation!.lat}" lon="${block.geolocation!.long}">
      <name>${encode(routeName)}</name>
      <desc>${encode(route.description ?? '')}</desc>
      <extensions>
        <osmand:color>${color}</osmand:color>
        <osmand:background>circle</osmand:background>
        <osmand:icon>sport_climbing</osmand:icon>
      </extensions>
    </wpt>
    `
      })
      .join('')}`
    })
    .join('')}


    ${parkingLocations
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

  return xml
}
