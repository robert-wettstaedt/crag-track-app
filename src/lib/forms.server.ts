import { fail, type ActionFailure } from '@sveltejs/kit'
import {
  type Area,
  type Ascent,
  type Block,
  type File,
  type FirstAscent,
  type Route,
  type Tag,
  type TopoRoute,
} from './db/schema'

export type AreaActionValues = Pick<Area, 'name' | 'type'>
export type AreaActionFailure = ActionFailure<AreaActionValues & { error: string }>

/**
 * Validates the area form data.
 *
 * @param {FormData} data - The form data to validate.
 * @returns {Promise<AreaActionValues>} The validated area action values.
 * @throws {ActionFailure<AreaActionValues & { error: string }>} If validation fails.
 */
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

/**
 * Validates the block form data.
 *
 * @param {FormData} data - The form data to validate.
 * @returns {Promise<BlockActionValues>} The validated block action values.
 * @throws {ActionFailure<BlockActionValues & { error: string }>} If validation fails.
 */
export const validateBlockForm = async (data: FormData): Promise<BlockActionValues> => {
  const name = data.get('name')
  const values = { name } as BlockActionValues

  if (typeof name !== 'string' || name.length === 0) {
    throw fail(400, { ...values, error: 'name is required' })
  }

  return values
}

export type RouteActionValues = Pick<Route, 'description' | 'name' | 'gradingScale' | 'grade'> & { tags: string[] }
export type RouteActionFailure = ActionFailure<RouteActionValues & { error: string }>

/**
 * Validates the route form data.
 *
 * @param {FormData} data - The form data to validate.
 * @returns {Promise<RouteActionValues>} The validated route action values.
 * @throws {ActionFailure<RouteActionValues & { error: string }>} If validation fails.
 */
export const validateRouteForm = async (data: FormData): Promise<RouteActionValues> => {
  const description = data.get('description')
  const name = data.get('name')
  const gradingScale = data.get('gradingScale')
  const grade = data.get('grade')
  const tags = data.getAll('tags')

  const values = { description, name, gradingScale, grade, tags } as RouteActionValues

  if (description != null && typeof description !== 'string') {
    throw fail(400, { ...values, error: 'description must be a valid string' })
  }

  if (name != null && typeof name !== 'string') {
    throw fail(400, { ...values, error: 'name must be a valid string' })
  }

  if (typeof gradingScale !== 'string' || gradingScale.length === 0) {
    throw fail(400, { ...values, error: 'gradingScale is required' })
  }

  if (grade != null && typeof grade !== 'string') {
    throw fail(400, { ...values, error: 'grade must be a valid string' })
  }

  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string')) {
    throw fail(400, { ...values, error: 'tags must be a valid string' })
  }

  return values
}

export type FirstAscentActionValues = Pick<FirstAscent, 'climberName' | 'year'>
export type FirstAscentActionFailure = ActionFailure<FirstAscentActionValues & { error: string }>

/**
 * Validates the first ascent form data.
 *
 * @param {FormData} data - The form data to validate.
 * @returns {Promise<FirstAscentActionValues>} The validated first ascent action values.
 * @throws {ActionFailure<FirstAscentActionValues & { error: string }>} If validation fails.
 */
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

/**
 * Validates the ascent form data.
 *
 * @param {FormData} data - The form data to validate.
 * @returns {Promise<AscentActionValues>} The validated ascent action values.
 * @throws {ActionFailure<AscentActionValues & { error: string }>} If validation fails.
 */
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

export type SaveTopoActionValues = Pick<TopoRoute, 'path' | 'routeFk' | 'topType' | 'topoFk'> & { id: string }
export type SaveTopoActionFailure = ActionFailure<SaveTopoActionValues & { error: string }>

export const validateSaveTopoForm = async (data: FormData) => {
  const rawId = data.get('id')
  const path = data.get('path')
  const rawRouteFk = data.get('routeFk')
  const rawTopoFk = data.get('topoFk')
  const topType = data.get('topType')

  const values = { id: rawId, path, routeFk: rawRouteFk, topoFk: rawTopoFk, topType } as SaveTopoActionValues

  const id = Number(rawId)
  const routeId = Number(rawRouteFk)
  const topoId = Number(rawTopoFk)

  if (rawId != null && Number.isNaN(id)) {
    throw fail(400, { ...values, error: 'id is not a valid number' })
  }

  if (rawRouteFk != null && Number.isNaN(routeId)) {
    throw fail(400, { ...values, error: 'routeFk is not a valid number' })
  }

  if (rawTopoFk != null && Number.isNaN(topoId)) {
    throw fail(400, { ...values, error: 'topoFk is not a valid number' })
  }

  if (typeof path !== 'string' || path.length === 0) {
    throw fail(400, { ...values, error: 'path is required' })
  }

  if (typeof topType !== 'string' || topType.length === 0) {
    throw fail(400, { ...values, error: 'topType is required' })
  }

  return values
}

export type AddTopoActionValues = {
  routeFk: string
  topoFk: string
}
export type AddTopoActionFailure = ActionFailure<AddTopoActionValues & { error: string }>

export const validateAddTopoForm = async (data: FormData): Promise<AddTopoActionValues> => {
  const rawRouteFk = data.get('routeFk')
  const rawTopoFk = data.get('topoFk')

  const values = { routeFk: rawRouteFk, topoFk: rawTopoFk } as AddTopoActionValues

  const routeFk = Number(rawRouteFk)
  const topoFk = Number(rawTopoFk)

  if (rawRouteFk != null && Number.isNaN(routeFk)) {
    throw fail(400, { ...values, error: 'routeFk is not a valid number' })
  }

  if (rawTopoFk != null && Number.isNaN(topoFk)) {
    throw fail(400, { ...values, error: 'topoFk is not a valid number' })
  }

  return values
}

export type TagActionValues = Pick<Tag, 'id'>
export type TagActionFailure = ActionFailure<TagActionValues & { error: string }>

/**
 * Validates the tag form data.
 *
 * @param {FormData} data - The form data to validate.
 * @returns {Promise<TagActionValues>} The validated tag action values.
 * @throws {ActionFailure<TagActionValues & { error: string }>} If validation fails.
 */
export const validateTagForm = async (data: FormData): Promise<TagActionValues> => {
  const id = data.get('id')
  const values = { id } as TagActionValues

  if (typeof id !== 'string' || id.length === 0) {
    throw fail(400, { ...values, error: 'id is required' })
  }

  return values
}
