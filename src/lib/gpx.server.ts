import { getToposOfArea } from '$lib/blocks.server'
import type { Coordinates, Line } from '$lib/components/TopoViewer/components/Route'
import * as schema from '$lib/db/schema'
import type { InferResultType } from '$lib/db/types'
import { getNextcloud, searchNextcloudFile } from '$lib/nextcloud/nextcloud.server'
import type { TopoRouteDTO } from '$lib/topo'
import type { Session } from '@auth/sveltekit'
import { error } from '@sveltejs/kit'
import { eq, inArray } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { encode as encodeHtml } from 'html-entities'
import { minify, type Options } from 'html-minifier'
import { DateTime } from 'luxon'
import sharp from 'sharp'
import stringToColor from 'string-to-color'
import type { BufferLike, FileStat, ResponseDataDetailed } from 'webdav'

interface TopoFile {
  base64: string
  width?: number
  height?: number
  scale: number
}

export const getAreaGPX = async (
  areaId: number,
  db: BetterSQLite3Database<typeof schema>,
  session?: Session | null,
) => {
  if (session == null) {
    error(401)
  }

  const { area, blocks } = await getToposOfArea(areaId, db, session)

  const parkingLocations = [
    ...area.parkingLocations,
    ...area.areas.flatMap((area) => area.parkingLocations),
    ...area.areas.flatMap((area) => area.areas).flatMap((area) => area.parkingLocations),
  ]

  const grades = await db.query.grades.findMany()
  let gradingScale: schema.UserSettings['gradingScale'] = 'FB'

  if (session.user?.email != null) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, session.user.email),
      with: {
        userSettings: true,
      },
    })

    gradingScale = user?.userSettings?.gradingScale ?? gradingScale
  }

  const enrichedBlocks = await loadBlockFiles(blocks, db, session)

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
        <name>${encodeHtml(area.name)}</name>
        <author>
          <name>${encodeHtml(area.author.userName)}</name>
          <email>${encodeHtml(area.author.email)}</email>
        </author>
        <copyright>
          <year>${encodeHtml(String(new Date().getFullYear()))}</year>
          <license>
            <href>https://creativecommons.org/licenses/by-nc-sa/4.0/</href>
          </license>
        </copyright>
      </metadata>

  ${enrichedBlocks
    .map((block) => {
      return `
    <wpt lat="${block.geolocation!.lat}" lon="${block.geolocation!.long}">
      <time>${encodeHtml(DateTime.fromSQL(block.createdAt).toISO())}</time>
      <name>${encodeHtml([block.area.parent.name, block.area.name, block.name].join(' / '))}</name>
      <desc>${prepareHtml(renderBlockHtml(block, grades, gradingScale))}</desc>
      <extensions>
        <osmand:color>${block.color}</osmand:color>
        <osmand:background>circle</osmand:background>
        <osmand:icon>natural_peak</osmand:icon>
      </extensions>
    </wpt>

    ${block.routes
      .map((route) => {
        return `
    <wpt lat="${block.geolocation!.lat}" lon="${block.geolocation!.long}">
      <name>${encodeHtml(renderRouteName(route, grades, gradingScale, false))}</name>
      <desc>${prepareHtml(renderRouteHtml(block, route, grades, gradingScale))}</desc>
      <extensions>
        <osmand:color>${block.color}</osmand:color>
        <osmand:background>circle</osmand:background>
        <osmand:icon>sport_climbing</osmand:icon>
      </extensions>
    </wpt>`
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

const loadBlockFiles = async (
  blocks: Awaited<ReturnType<typeof getToposOfArea>>['blocks'],
  db: BetterSQLite3Database<typeof schema>,
  session: Session,
) => {
  async function getTopoFile(stat: FileStat) {
    const content = await nextcloud?.getFileContents(stat.filename, { details: true })
    const { data } = content as ResponseDataDetailed<BufferLike>

    const image = sharp(data)
    const rawMetadata = await image.metadata()
    const resized = await image.resize({ width: 350 }).toBuffer()
    const resizedMetadata = await sharp(resized).metadata()

    if (resizedMetadata.width === undefined || rawMetadata.width === undefined) {
      throw new Error('Metadata width is undefined')
    }

    const scale = resizedMetadata.width / rawMetadata.width
    const base64 = resized.toString('base64')

    return {
      base64,
      width: resizedMetadata.width,
      height: resizedMetadata.height,
      scale,
    } satisfies TopoFile
  }

  const nextcloud = getNextcloud(session)

  const allRoutes = blocks.flatMap((block) => block.routes)
  const routeFiles = await db.query.files.findMany({
    where: inArray(
      schema.files.routeFk,
      allRoutes.map((route) => route.id),
    ),
  })

  return await Promise.all(
    blocks.map(async (block) => {
      const topos = await Promise.all(
        block.topos.map(async (topo) => {
          const stat = await searchNextcloudFile(session, topo.file)
          const topoFile = await getTopoFile(stat)
          return { ...topo, file: topoFile }
        }),
      )

      const routes = await Promise.all(
        block.routes.map(async (route) => {
          const files = routeFiles.filter((file) => file.routeFk === route.id)

          const stats = await Promise.all(files.flatMap((file) => searchNextcloudFile(session, file)))
          const topoFiles = await Promise.all(
            stats.filter((stat) => stat.mime?.includes('image')).map((stat) => getTopoFile(stat)),
          )

          return { ...route, files: topoFiles }
        }),
      )

      const color = stringToColor(block.area.type === 'crag' ? block.area.id : block.area.parentFk)

      return { ...block, color, routes, topos }
    }),
  )
}

const renderBlockHtml = (
  block: Awaited<ReturnType<typeof loadBlockFiles>>[0],
  grades: schema.Grade[],
  gradingScale: schema.UserSettings['gradingScale'],
): string => {
  return [
    block.topos
      .map(
        (topo) => `
        <div style="margin-top: 16px; position: relative;">
          ${renderTopo(topo)}

          ${topo.routes
            .map((topoRoute, index) => {
              const route = block.routes.find((route) => route.id === topoRoute.routeFk)

              if (route == null) {
                return ''
              }

              return renderRoute(route, grades, gradingScale, index)
            })
            .join('')}
        </div>`,
      )
      .join('\n'),

    '<hr />',

    block.routes
      .filter(
        (route) => !block.topos.flatMap((topo) => topo.routes).some((topoRoute) => topoRoute.routeFk === route.id),
      )
      .map((route) => renderRoute(route, grades, gradingScale))
      .join(''),
  ].join('\n')
}

const renderRouteHtml = (
  block: Awaited<ReturnType<typeof loadBlockFiles>>[0],
  route: Awaited<ReturnType<typeof loadBlockFiles>>[0]['routes'][0],
  grades: schema.Grade[],
  gradingScale: schema.UserSettings['gradingScale'],
): string => {
  return `
    <h4>${[block.area.parent.name, block.area.name, block.name].join(' / ')}</h4>
    <h3>${renderRouteName(route, grades, gradingScale)}</h3>
    <div style="margin-top: 16px; position: relative;">
      ${block.topos
        .map((topo) => {
          if (topo.blockFk !== route.blockFk) {
            return ''
          }

          const topoRoute = topo.routes.find((topoRoute) => topoRoute.routeFk === route.id)

          if (topoRoute == null) {
            return ''
          }

          return renderTopo({ ...topo, routes: [topoRoute] })
        })
        .join('\n')}
    </div>

    ${renderRouteDescription(route)}

    ${route.files
      .map(({ base64, height, width }) => {
        return `
        <div style="margin-top: 16px;">
          <img src="data:image/jpeg;base64,${base64}" width="${width}" height="${height}" />
        </div>`
      })
      .join('\n')}
  `
}

const renderRouteName = (
  route: schema.Route,
  grades: schema.Grade[],
  gradingScale: schema.UserSettings['gradingScale'],
  specialCharacters = true,
): string => {
  return [
    route.name.length === 0 ? '?' : route.name,
    route.gradeFk == null ? null : grades.find((grade) => grade.id === route.gradeFk)?.[gradingScale],
    route.rating == null ? null : new Array(route.rating).fill(specialCharacters ? '⭐️' : '*').join(''),
  ]
    .filter(Boolean)
    .join(specialCharacters ? ' • ' : ' - ')
}

const renderRouteDescription = (
  route: InferResultType<'routes', { firstAscent: { with: { climber: true } }; tags: true }>,
): string => {
  return [
    route.firstAscent == null
      ? null
      : `<p style="margin-top: 16px;">
            ${(route.firstAscent.climber?.userName ?? route.firstAscent.climberName) == null ? '' : `${route.firstAscent.climber?.userName ?? route.firstAscent.climberName}&nbsp;`}

            ${route.firstAscent.year ?? ''}
          </p>`,

    route.tags.length === 0
      ? null
      : `<div style="margin-top: 16px;">
          ${route.tags.map((tag) => `<span style="margin-right: 4px;">#${tag.tagFk}</span>`).join('')}
        </div>`,

    route.description == null ? null : `<p style="margin-top: 16px;">${route.description}</p>`,
  ]
    .filter(Boolean)
    .join('\n')
}

const renderRoute = (
  route: InferResultType<'routes', { firstAscent: { with: { climber: true } }; tags: true }>,
  grades: schema.Grade[],
  gradingScale: schema.UserSettings['gradingScale'],
  key?: number,
): string => {
  return `
    <div style="margin-top: 4px;">
      <h3>
        ${key == null ? '' : `<strong>${key + 1}.</strong>`}

        ${renderRouteName(route, grades, gradingScale)}
      </h3>

      ${renderRouteDescription(route)}
    </div>`
}

const renderTopo = (topo: InferResultType<'topos'> & { file: TopoFile; routes: TopoRouteDTO[] }) => {
  const { base64, scale, height, width } = topo.file

  return `
    <img src="data:image/jpeg;base64,${base64}" width="${width}" height="${height}" />

    <svg
      height="${height}"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"
      viewBox="0 0 ${width} ${height}"
      width="${width}"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${topo.routes.map((route, index) => {
        let lines: Array<Line> = []
        let center = undefined as Coordinates | undefined

        const calcCenter = () => {
          const totalLength = lines.reduce((total, line) => total + line.length, 0)
          let centerLength = totalLength / 2

          for (let index = 0; index < lines.length; index++) {
            const line = lines[index]

            if (centerLength > line.length) {
              centerLength -= line.length
              continue
            }

            const ratio = centerLength / line.length
            center = {
              x: (1 - ratio) * line.from.x + ratio * line.to.x,
              y: (1 - ratio) * line.from.y + ratio * line.to.y,
            }
            return
          }
        }

        const calcLines = () => {
          const startPoints = route.points.filter((point) => point.type === 'start')
          let startPoint: Coordinates | undefined = startPoints.at(0)

          if (startPoints.length === 2) {
            const [from, to] = startPoints

            lines = [...lines, { from, to, length: 0 }]
            startPoint = {
              x: (from.x + to.x) / 2,
              y: (from.y + to.y) / 2,
            }
          }

          if (startPoint == null) {
            return
          }

          const nonStartPoints = route.points
            .filter((point) => point.type !== 'start')
            .toSorted((a, b) => {
              const aDist = Math.sqrt(Math.pow(startPoint.x - a.x, 2) + Math.pow(startPoint.y - a.y, 2))
              const bDist = Math.sqrt(Math.pow(startPoint.x - b.x, 2) + Math.pow(startPoint.y - b.y, 2))

              return aDist - bDist
            })

          const linesToAdd = [startPoint, ...nonStartPoints].flatMap((from, index, arr): Line[] => {
            const to = arr.at(index + 1)

            if (to == null) {
              return []
            }

            return [{ from, to, length: Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)) }]
          })

          lines = [...lines, ...linesToAdd]

          calcCenter()
        }

        calcLines()

        return `
          <g>
            ${lines.map(
              (line) => `
                <line
                  data-id="line"
                  stroke-width="4"
                  stroke="black"
                  x1="${line.from.x * scale}"
                  x2="${line.to.x * scale}"
                  y1="${line.from.y * scale}"
                  y2="${line.to.y * scale}"
                />

                <line
                  data-id="line"
                  stroke-width="2"
                  stroke="#4ade80"
                  x1="${line.from.x * scale}"
                  x2="${line.to.x * scale}"
                  y1="${line.from.y * scale}"
                  y2="${line.to.y * scale}"
                />
              `,
            )}

            ${route.points.map((point) =>
              point.type === 'start'
                ? `
                <circle
                  cx="${point.x * scale}"
                  cy="${point.y * scale}"
                  fill="transparent"
                  r="11"
                  role="presentation"
                  stroke="black"
                />

                <circle
                  cx="${point.x * scale}"
                  cy="${point.y * scale}"
                  data-id="${point.id}"
                  fill="transparent"
                  id="start-bg-inner"
                  r="9"
                  role="presentation"
                  stroke="black"
                />

                <circle
                  cx="${point.x * scale}"
                  cy="${point.y * scale}"
                  data-id="${point.id}"
                  fill="transparent"
                  id="start"
                  r="10"
                  role="presentation"
                  stroke-width="1"
                  stroke="#4ade80"
                />`
                : point.type === 'middle'
                  ? `
                <circle
                  cx="${point.x * scale}"
                  cy="${point.y * scale}"
                  data-id="${point.id}"
                  fill="black"
                  fill="transparent"
                  id="middle-bg"
                  r="6"
                />

                <circle
                  cx="${point.x * scale}"
                  cy="${point.y * scale}"
                  data-id="${point.id}"
                  fill="green"
                  fill="transparent"
                  id="middle"
                  r="5"
                />
              `
                  : point.type === 'top'
                    ? route.topType === 'topout'
                      ? `
                  <polyline
                    data-id="${point.id}"
                    fill="transparent"
                    id="topout-bg"
                    points=${`${point.x - 20},${point.y + 20} ${point.x},${point.y}, ${point.x + 20},${point.y + 20}`}
                    stroke-width="4"
                    stroke="black"
                  />

                  <polyline
                    data-id="${point.id}"
                    fill="transparent"
                    id="topout"
                    points=${`${point.x - 20},${point.y + 20} ${point.x},${point.y}, ${point.x + 20},${point.y + 20}`}
                    stroke-width="2"
                    stroke="#4ade80"
                  />
                `
                      : `
                  <line
                    data-id="${point.id}"
                    fill="transparent"
                    id="top-bg"
                    stroke-width="4"
                    stroke="black"
                    x1="${point.x * scale - 20}"
                    x2="${point.x * scale + 20}"
                    y1="${point.y * scale}"
                    y2="${point.y * scale}"
                  />

                  <line
                    data-id="${point.id}"
                    fill="transparent"
                    id="top"
                    stroke-width="2"
                    stroke="#4ade80"
                    x1="${point.x * scale - 20}"
                    x2="${point.x * scale + 20}"
                    y1="${point.y * scale}"
                    y2="${point.y * scale}"
                  />
                  `
                    : '',
            )}

            ${
              center == null
                ? ''
                : `
                <rect
                  fill="black"
                  height="${40 * scale}"
                  id="key-bg"
                  width="${40 * scale}"
                  x="${center.x * scale - 50 * scale}"
                  y="${center.y * scale - 60 * scale}"
                />

                <text
                  fill="#4ade80"
                  font-size="${25 * scale}"
                  id="key"
                  x="${center.x * scale - 38 * scale}"
                  y="${center.y * scale - 30 * scale}"
                >
                  ${index + 1}
                </text>`
            }
          </g>
        `
      })}
    </svg>
  `
}

const prepareHtml = (str: string): string => {
  const opts: Options = {
    caseSensitive: false,
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: false,
    collapseWhitespace: true,
    conservativeCollapse: false,
    continueOnParseError: true,
    decodeEntities: true,
    includeAutoGeneratedTags: false,
    keepClosingSlash: false,
    maxLineLength: 0,
    minifyCSS: true,
    minifyJS: true,
    preserveLineBreaks: false,
    preventAttributesEscaping: false,
    processConditionalComments: true,
    processScripts: ['text/html'],
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeEmptyElements: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    sortAttributes: true,
    sortClassName: true,
    trimCustomFragments: true,
    useShortDoctype: true,
  }

  return encodeXml(encodeHtml(minify(str, opts)))
}

const encodeXml = (str: string): string => {
  let isInBase64 = false
  let newStr = ''

  for (let i = 0; i < str.length; i++) {
    const substr = str.substring(i)
    const c = str[i]
    const cc = str.charCodeAt(i)

    if (isInBase64) {
      if (c === '"' || substr.indexOf('&quot;') === 0) {
        isInBase64 = false
      } else {
        newStr += c
        continue
      }
    }

    if (substr.indexOf('base64,') === 0) {
      isInBase64 = true
    }

    newStr += cc >= 127 ? `&#${cc};` : c
  }

  return newStr
}
