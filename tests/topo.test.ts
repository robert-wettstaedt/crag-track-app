import { describe, expect, it } from 'vitest'
import { convertPathToPoints, convertPointsToPath, type PointDTO } from '../src/lib/topo'

describe('pathToPoints', () => {
  it('should correctly parse a path with start and middle points', () => {
    const path = 'M10,20 L30,40'
    const result = convertPathToPoints(path)
    expect(result).toMatchObject([
      { type: 'start', x: 10, y: 20 },
      { type: 'middle', x: 30, y: 40 },
    ])
  })

  it('should handle paths ending with Z', () => {
    const path = 'M10,20 L30,40 Z'
    const result = convertPathToPoints(path)
    expect(result).toMatchObject([
      { type: 'start', x: 10, y: 20 },
      { type: 'top', x: 30, y: 40 },
    ])
  })

  it('should handle paths with 2 start positions', () => {
    const path = 'M10,20 M20,20 L30,40 Z'
    const result = convertPathToPoints(path)
    expect(result).toMatchObject([
      { type: 'start', x: 10, y: 20 },
      { type: 'start', x: 20, y: 20 },
      { type: 'top', x: 30, y: 40 },
    ])
  })

  it('should throw an error for unsupported point types', () => {
    const path = 'M10,20 X30,40'
    expect(() => convertPathToPoints(path)).toThrow('Unsupported point type: X30,40')
  })

  it('should throw an error for invalid coordinates', () => {
    const path = 'M10,20 L30,forty'
    expect(() => convertPathToPoints(path)).toThrow('Invalid point: L30,FORTY')
  })
})

describe('convertPointsToPath', () => {
  it('should correctly parse a path with start and middle points', () => {
    const points: PointDTO[] = [
      { id: '1', type: 'start', x: 10, y: 20 },
      { id: '2', type: 'middle', x: 30, y: 40 },
      { id: '3', type: 'top', x: 40, y: 50 },
    ]
    const result = convertPointsToPath(points)
    expect(result).toEqual('M10,20 L30,40 L40,50 Z')
  })

  it('should correctly parse a path with only start points', () => {
    const points: PointDTO[] = [
      { id: '1', type: 'start', x: 10, y: 20 },
      { id: '2', type: 'start', x: 30, y: 40 },
    ]
    const result = convertPointsToPath(points)
    expect(result).toEqual('M30,40 M10,20')
  })

  it('should correctly parse a path with only middle points', () => {
    const points: PointDTO[] = [
      { id: '1', type: 'middle', x: 10, y: 20 },
      { id: '2', type: 'middle', x: 30, y: 40 },
    ]
    const result = convertPointsToPath(points)
    expect(result).toEqual('L10,20 L30,40')
  })

  it('should correctly parse a path with only top points', () => {
    const points: PointDTO[] = [
      { id: '1', type: 'top', x: 10, y: 20 },
      { id: '2', type: 'top', x: 30, y: 40 },
    ]
    const result = convertPointsToPath(points)
    expect(result).toEqual('L10,20 L30,40 Z')
  })

  it('should return an empty string for an empty array', () => {
    const points: PointDTO[] = []
    const result = convertPointsToPath(points)
    expect(result).toEqual('')
  })

  it('should correctly parse a path with mixed point types', () => {
    const points: PointDTO[] = [
      { id: '1', type: 'start', x: 10, y: 20 },
      { id: '2', type: 'middle', x: 30, y: 40 },
      { id: '3', type: 'start', x: 50, y: 60 },
      { id: '4', type: 'top', x: 70, y: 80 },
      { id: '5', type: 'middle', x: 90, y: 100 },
    ]
    const result = convertPointsToPath(points)
    expect(result).toEqual('M50,60 M10,20 L30,40 L70,80 L90,100 Z')
  })
})
