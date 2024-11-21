import type { PointDTO } from '$lib/topo'
import type { Coordinates, Line } from './Route.svelte'

export const calcLines = (points: PointDTO[]): Line[] => {
  const startPoints = points.filter((point) => point.type === 'start')
  let startPoint: Coordinates | undefined = startPoints.at(0)
  const lines: Array<Line> = []

  if (startPoints.length === 2) {
    const [from, to] = startPoints

    lines.push({ from, to, length: 0 })
    startPoint = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
    }
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

export const calcCenter = (lines: Line[]): Coordinates | undefined => {
  const totalLength = lines.reduce((total, line) => total + line.length, 0)
  let centerLength = totalLength / 2

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]

    if (centerLength > line.length) {
      centerLength -= line.length
      continue
    }

    const ratio = centerLength / line.length
    return {
      x: (1 - ratio) * line.from.x + ratio * line.to.x,
      y: (1 - ratio) * line.from.y + ratio * line.to.y,
    }
  }
}
