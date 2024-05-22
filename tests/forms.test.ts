import { describe, expect, it } from 'vitest'
import {
  validateAreaForm,
  validateAscentForm,
  validateBlockForm,
  validateFirstAscentForm,
  validateRouteForm,
} from '../src/lib/forms.server'

describe('validateAreaForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Area')
    formData.set('type', 'crag')

    const result = await validateAreaForm(formData)
    expect(result).toEqual({ name: 'Test Area', type: 'crag' })
  })

  it('should throw an error if name is missing', async () => {
    const formData = new FormData()
    formData.set('type', 'crag')

    await expect(validateAreaForm(formData)).rejects.toThrowError()
  })

  it('should throw an error if type is missing', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Area')

    await expect(validateAreaForm(formData)).rejects.toThrowError()
  })
})

describe('validateBlockForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('name', 'Test Block')

    const result = await validateBlockForm(formData)
    expect(result).toEqual({ name: 'Test Block' })
  })

  it('should throw an error if name is missing', async () => {
    const formData = new FormData()

    await expect(validateBlockForm(formData)).rejects.toThrowError()
  })
})

describe('validateRouteForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('description', 'Test Description')
    formData.set('name', 'Test Route')
    formData.set('gradingScale', 'V Scale')
    formData.set('grade', 'V5')

    const result = await validateRouteForm(formData)
    expect(result).toEqual({
      description: 'Test Description',
      name: 'Test Route',
      gradingScale: 'V Scale',
      grade: 'V5',
    })
  })

  it('should throw an error if name is missing', async () => {
    const formData = new FormData()
    formData.set('description', 'Test Description')
    formData.set('gradingScale', 'V Scale')
    formData.set('grade', 'V5')

    await expect(validateRouteForm(formData)).rejects.toThrowError()
  })

  it('should throw an error if gradingScale is missing', async () => {
    const formData = new FormData()
    formData.set('description', 'Test Description')
    formData.set('name', 'Test Route')
    formData.set('grade', 'V5')

    await expect(validateRouteForm(formData)).rejects.toThrowError()
  })
})

describe('validateFirstAscentForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('climberName', 'John Doe')
    formData.set('year', '2021')

    const result = await validateFirstAscentForm(formData)
    expect(result).toEqual({ climberName: 'John Doe', year: '2021' })
  })

  it('should throw an error if year is not a valid number', async () => {
    const formData = new FormData()
    formData.set('climberName', 'John Doe')
    formData.set('year', 'invalid')

    await expect(validateFirstAscentForm(formData)).rejects.toThrowError()
  })

  it('should throw an error if both climberName and year are missing', async () => {
    const formData = new FormData()

    await expect(validateFirstAscentForm(formData)).rejects.toThrowError()
  })
})

describe('validateAscentForm', () => {
  it('should validate and return correct values', async () => {
    const formData = new FormData()
    formData.set('dateTime', '2023-01-01T00:00:00Z')
    formData.set('grade', 'V5')
    formData.set('notes', 'Test notes')
    formData.set('type', 'boulder')
    formData.append('file.path', 'path/to/file1')
    formData.append('file.path', 'path/to/file2')

    const result = await validateAscentForm(formData)
    expect(result).toEqual({
      dateTime: '2023-01-01T00:00:00Z',
      grade: 'V5',
      notes: 'Test notes',
      type: 'boulder',
      filePaths: ['path/to/file1', 'path/to/file2'],
    })
  })

  it('should throw an error if dateTime is missing', async () => {
    const formData = new FormData()
    formData.set('grade', 'V5')
    formData.set('notes', 'Test notes')
    formData.set('type', 'boulder')

    await expect(validateAscentForm(formData)).rejects.toThrowError()
  })

  it('should throw an error if type is missing', async () => {
    const formData = new FormData()
    formData.set('dateTime', '2023-01-01T00:00:00Z')
    formData.set('grade', 'V5')
    formData.set('notes', 'Test notes')

    await expect(validateAscentForm(formData)).rejects.toThrowError()
  })
})
