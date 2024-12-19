import {
  areaActionSchema,
  ascentActionSchema,
  blockActionSchema,
  firstAscentActionSchema,
  routeActionSchema,
  validate,
} from '$lib/forms.server'
import { describe, expect, it } from 'vitest'

describe('validateAreaForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Area')
    formData.set('type', 'crag')

    const result = await validate(areaActionSchema, formData)
    expect(result).toEqual({ name: 'Test Area', type: 'crag' })
  })

  it('should throw an error if name is missing', async () => {
    const formData = new FormData()
    formData.set('type', 'crag')

    await expect(validate(areaActionSchema, formData)).rejects.toThrowError()
  })

  it('should default value if type is missing', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Area')

    const result = await validate(areaActionSchema, formData)
    expect(result).toEqual({ name: 'Test Area', type: 'area' })
  })

  it('should throw an error if type is invalid', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Area')
    formData.set('type', 'invalid')

    await expect(validate(areaActionSchema, formData)).rejects.toThrowError()
  })

  it('should handle empty strings as missing values', async () => {
    const formData = new FormData()
    formData.set('name', '')
    formData.set('type', 'crag')

    await expect(validate(areaActionSchema, formData)).rejects.toThrowError()
  })

  it('should trim whitespace from strings', async () => {
    const formData = new FormData()
    formData.set('name', '  Test Area  ')
    formData.set('type', 'crag')

    const result = await validate(areaActionSchema, formData)
    expect(result).toEqual({ name: 'Test Area', type: 'crag' })
  })
})

describe('validateBlockForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Block')

    const result = await validate(blockActionSchema, formData)
    expect(result).toEqual({ name: 'Test Block' })
  })

  it('should throw an error if name is missing', async () => {
    const formData = new FormData()

    await expect(validate(blockActionSchema, formData)).rejects.toThrowError()
  })
})

describe('validateRouteForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Route')
    formData.set('gradeFk', '1')
    formData.set('rating', '1')

    const result = await validate(routeActionSchema, formData)
    expect(result).toEqual({
      name: 'Test Route',
      gradeFk: 1,
      rating: 1,
    })
  })

  it('should throw an error if name is missing', async () => {
    const formData = new FormData()
    formData.set('description', 'Test Description')
    formData.set('gradeFk', '1')

    await expect(validate(routeActionSchema, formData)).rejects.toThrowError()
  })

  it('should throw an error if gradingScale is missing', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Route')

    await expect(validate(routeActionSchema, formData)).rejects.toThrowError()
  })

  it('should throw an error if rating is out of range', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Route')
    formData.set('rating', '0')

    await expect(validate(routeActionSchema, formData)).rejects.toThrowError()
  })
})

describe('validateFirstAscentForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('climberName', 'John Doe')
    formData.set('year', '2021')

    const result = await validate(firstAscentActionSchema, formData)
    expect(result).toEqual({ climberName: 'John Doe', year: 2021 })
  })

  it('should throw an error if year is not a valid number', async () => {
    const formData = new FormData()
    formData.set('climberName', 'John Doe')
    formData.set('year', 'invalid')

    await expect(validate(firstAscentActionSchema, formData)).rejects.toThrowError()
  })

  it('should throw an error if both climberName and year are missing', async () => {
    const formData = new FormData()

    await expect(validate(firstAscentActionSchema, formData)).rejects.toThrowError()
  })

  it('should validate year is within reasonable range', async () => {
    const formData = new FormData()
    formData.set('climberName', 'John Doe')
    formData.set('year', '1800')

    await expect(validate(firstAscentActionSchema, formData)).rejects.toThrowError()
  })

  it('should handle future years', async () => {
    const formData = new FormData()
    formData.set('climberName', 'John Doe')
    formData.set('year', '2050')

    await expect(validate(firstAscentActionSchema, formData)).rejects.toThrowError()
  })
})

describe('validateAscentForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('dateTime', '2023-01-01T00:00:00Z')
    formData.set('gradeFk', '1')
    formData.set('notes', 'Test notes')
    formData.set('type', 'flash')
    formData.append('filePaths', 'path/to/file1')
    formData.append('filePaths', 'path/to/file2')

    const result = await validate(ascentActionSchema, formData)
    expect(result).toEqual({
      dateTime: '2023-01-01T00:00:00Z',
      gradeFk: 1,
      notes: 'Test notes',
      type: 'flash',
      filePaths: ['path/to/file1', 'path/to/file2'],
    })
  })

  it('should throw an error if dateTime is missing', async () => {
    const formData = new FormData()
    formData.set('notes', 'Test notes')
    formData.set('type', 'flash')

    await expect(validate(ascentActionSchema, formData)).rejects.toThrowError()
  })

  it('should throw an error if type is missing', async () => {
    const formData = new FormData()
    formData.set('dateTime', '2023-01-01T00:00:00Z')
    formData.set('notes', 'Test notes')

    await expect(validate(ascentActionSchema, formData)).rejects.toThrowError()
  })

  it('should handle invalid date format', async () => {
    const formData = new FormData()
    formData.set('dateTime', 'invalid-date')
    formData.set('type', 'flash')

    await expect(validate(ascentActionSchema, formData)).rejects.toThrowError()
  })

  it('should handle optional file paths', async () => {
    const formData = new FormData()
    formData.set('dateTime', '2023-01-01T00:00:00Z')
    formData.set('type', 'flash')

    const result = await validate(ascentActionSchema, formData)
    expect(result).toEqual({
      dateTime: '2023-01-01T00:00:00Z',
      type: 'flash',
    })
  })
})
