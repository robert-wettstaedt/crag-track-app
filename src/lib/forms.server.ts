import { fail, type ActionFailure } from '@sveltejs/kit'
import { type Area, type Ascent, type Block, type File, type FirstAscent, type Route } from './db/schema'
import type { Point } from './components/TopoViewer'

export type AreaActionValues = Pick<Area, 'name' | 'type'>
export type AreaActionFailure = ActionFailure<AreaActionValues & { error: string }>

export const validateAreaForm = async (data: FormData): Promise<AreaActionValues> => {
  const name = data.get('name')
  const type = data.get('type')
  const values = { name, type } as AreaActionValues

  if (typeof name !== 'string' || name.length === 0) {
    throw fail(400, { ...values, error: 'name is required' })
  }

  if (typeof type !== 'string' || type.length === 0) {
    throw fail(400, { ...values, error: 'type is required' })
  }

  return values
}

export type BlockActionValues = Pick<Block, 'name'>
export type BlockActionFailure = ActionFailure<BlockActionValues & { error: string }>

export const validateBlockForm = async (data: FormData): Promise<BlockActionValues> => {
  const name = data.get('name')
  const values = { name } as BlockActionValues

  if (typeof name !== 'string' || name.length === 0) {
    throw fail(400, { ...values, error: 'name is required' })
  }

  return values
}

export type RouteActionValues = Pick<Route, 'description' | 'name' | 'gradingScale' | 'grade'>
export type RouteActionFailure = ActionFailure<RouteActionValues & { error: string }>

export const validateRouteForm = async (data: FormData): Promise<RouteActionValues> => {
  const description = data.get('description')
  const name = data.get('name')
  const gradingScale = data.get('gradingScale')
  const grade = data.get('grade')
  const values = { description, name, gradingScale, grade } as RouteActionValues

  if (description != null && typeof description !== 'string') {
    throw fail(400, { ...values, error: 'description must be a valid string' })
  }

  if (typeof name !== 'string' || name.length === 0) {
    throw fail(400, { ...values, error: 'name is required' })
  }

  if (typeof gradingScale !== 'string' || gradingScale.length === 0) {
    throw fail(400, { ...values, error: 'gradingScale is required' })
  }

  if (grade != null && typeof grade !== 'string') {
    throw fail(400, { ...values, error: 'grade must be a valid string' })
  }

  return values
}

export type FirstAscentActionValues = Pick<FirstAscent, 'climberName' | 'year'>
export type FirstAscentActionFailure = ActionFailure<FirstAscentActionValues & { error: string }>

export const validateFirstAscentForm = async (data: FormData): Promise<FirstAscentActionValues> => {
  const climberName = data.get('climberName')
  const rawYear = data.get('year')
  const values = { climberName, year: rawYear } as FirstAscentActionValues

  const year = Number(rawYear)

  if (climberName != null && typeof climberName !== 'string') {
    throw fail(400, { ...values, error: 'climberName must be a valid string' })
  }

  if (rawYear != null && typeof rawYear !== 'string') {
    throw fail(400, { ...values, error: 'year must be a valid string' })
  }

  if (rawYear != null && Number.isNaN(year)) {
    throw fail(400, { ...values, error: 'year is not a valid number' })
  }

  if ((climberName == null || climberName.trim().length === 0) && (rawYear == null || rawYear.trim().length === 0)) {
    throw fail(400, { ...values, error: 'Either climberName or year must be set' })
  }

  return values
}

export type AscentActionValues = Pick<Ascent, 'dateTime' | 'grade' | 'notes' | 'type'> & {
  filePaths: File['path'][] | null
}
export type AscentActionFailure = ActionFailure<AscentActionValues & { error: string }>

export const validateAscentForm = async (data: FormData): Promise<AscentActionValues> => {
  const dateTime = data.get('dateTime')
  const grade = data.get('grade')
  const notes = data.get('notes')
  const type = data.get('type')
  const filePaths = data.getAll('file.path')

  const values = { dateTime, grade, notes, type, filePaths } as AscentActionValues

  if (typeof dateTime !== 'string' || dateTime.length === 0) {
    throw fail(400, { ...values, error: 'dateTime is required' })
  }

  if (typeof type !== 'string' || type.length === 0) {
    throw fail(400, { ...values, error: 'type is required' })
  }

  if (grade != null && typeof grade !== 'string') {
    throw fail(400, { ...values, error: 'grade must be a valid string' })
  }

  if (notes != null && typeof notes !== 'string') {
    throw fail(400, { ...values, error: 'notes must be a valid string' })
  }

  if (!Array.isArray(filePaths) || filePaths.some((filePath) => typeof filePath !== 'string')) {
    throw fail(400, { ...values, error: 'file.path must be a valid string' })
  }

  return values
}

export const validateTopoForm = async (data: FormData) => {
  const rawCount = data.get('count')
  const count = Number(rawCount)

  const topType = data.get('topType')

  const xItems = data.getAll('points.x')
  const yItems = data.getAll('points.y')
  const typeItems = data.getAll('points.type')

  const values = { count, x: xItems, y: yItems, type: typeItems }

  if (Number.isNaN(count) || count !== xItems.length || count !== yItems.length || count !== typeItems.length) {
    throw fail(400, { ...values, error: `Unable to verify count: ${count}` })
  }

  if (typeof topType !== 'string' || topType.length === 0) {
    throw fail(400, { ...values, error: 'topType is required' })
  }

  const points: Point[] = []

  for (let index = 0; index < count; index++) {
    const type = typeItems[index] as Point['type']
    const x = Number(xItems[index])
    const y = Number(yItems[index])

    if (typeof type !== 'string' || type.length === 0) {
      throw fail(400, { ...values, error: 'point type is required' })
    }

    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw fail(400, { ...values, error: `point coordinate must be a number: "${xItems[index]}, ${yItems[index]}"` })
    }

    points.push({ id: 0, type, x, y })
  }

  console.log(points)
}
