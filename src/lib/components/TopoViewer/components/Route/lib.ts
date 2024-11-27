import type { PointDTO } from '$lib/topo'
import type { Coordinates, Line } from './Route.svelte'

export const calcLines = (points: PointDTO[]): Line[] => {
  const startPoints = points.filter((point) => point.type === 'start')
  const startPoint = calcMiddlePoint(startPoints)
  const lines: Array<Line> = []

  if (startPoints.length === 2) {
    const [from, to] = startPoints
    lines.push({ from, to, length: 0 })
  }

  if (startPoint == null) {
    return []
  }

  const nonStartPoints = points
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

  return [...lines, ...linesToAdd]
}

export const calcMiddlePoint = (points: PointDTO[]): Coordinates | undefined => {
  const coordinate = points.reduce(
    (coordinate, point, _, arr) => ({
      x: (coordinate?.x ?? 0) + point.x / arr.length,
      y: (coordinate?.y ?? 0) + point.y / arr.length,
    }),
    undefined as Coordinates | undefined,
  )

  return coordinate
}
