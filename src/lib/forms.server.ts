import { fail, type ActionFailure } from '@sveltejs/kit'
import { type Area, type Ascent, type Boulder, type Crag } from './db/schema'

export type AreaActionValues = Pick<Area, 'name'>
export type AreaActionFailure = ActionFailure<AreaActionValues & { error: string }>

export const validateAreaForm = async (data: FormData): Promise<AreaActionValues> => {
  const name = data.get('name')
  const values = { name } as CragActionValues

  if (typeof name !== 'string' || name.length === 0) {
    throw fail(400, { ...values, error: 'name is required' })
  }

  return values
}

export type CragActionValues = Pick<Crag, 'name'>
export type CragActionFailure = ActionFailure<CragActionValues & { error: string }>

export const validateCragForm = async (data: FormData): Promise<CragActionValues> => {
  const name = data.get('name')
  const values = { name } as CragActionValues

  if (typeof name !== 'string' || name.length === 0) {
    throw fail(400, { ...values, error: 'name is required' })
  }

  return values
}

export type BoulderActionValues = Pick<Boulder, 'name' | 'gradingScale' | 'grade'>
export type BoulderActionFailure = ActionFailure<BoulderActionValues & { error: string }>

export const validateBoulderForm = async (data: FormData): Promise<BoulderActionValues> => {
  const name = data.get('name')
  const gradingScale = data.get('gradingScale')
  const grade = data.get('grade')
  const values = { name, gradingScale, grade } as BoulderActionValues

  if (typeof name !== 'string' || name.length === 0) {
    throw fail(400, { ...values, error: 'name is required' })
  }

  if (gradingScale != null && typeof gradingScale !== 'string') {
    throw fail(400, { ...values, error: 'gradingScale must be a valid string' })
  }

  if (grade != null && typeof grade !== 'string') {
    throw fail(400, { ...values, error: 'grade must be a valid string' })
  }

  return values
}

export type AscentActionValues = Pick<Ascent, 'dateTime' | 'grade' | 'notes' | 'type'>
export type AscentActionFailure = ActionFailure<AscentActionValues & { error: string }>

export const validateAscentForm = async (data: FormData): Promise<AscentActionValues> => {
  const dateTime = data.get('dateTime')
  const grade = data.get('grade')
  const notes = data.get('notes')
  const type = data.get('type')
  const values = { dateTime, grade, notes, type } as AscentActionValues

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

  return values
}
