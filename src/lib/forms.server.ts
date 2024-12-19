import { areaTypeEnum, ascentTypeEnum, topoRouteTopTypeEnum } from '$lib/db/schema'
import { convertException } from '$lib/errors'
import { fail } from '@sveltejs/kit'
import { z } from 'zod'

function getSchemaShape<Output = unknown, Def extends z.ZodTypeDef = z.ZodObjectDef, Input = Output>(
  schema: z.ZodType<Output, Def, Input>,
): z.ZodRawShape | undefined {
  const def = schema._def as unknown

  if ((def as z.ZodObjectDef).typeName === z.ZodFirstPartyTypeKind.ZodObject) {
    return (def as z.ZodObjectDef).shape()
  }

  if ((def as z.ZodEffectsDef<z.ZodObject<z.ZodRawShape>>).typeName === z.ZodFirstPartyTypeKind.ZodEffects) {
    return (def as z.ZodEffectsDef<z.ZodObject<z.ZodRawShape>>).schema._def.shape()
  }
}

export async function validate<Output = unknown, Def extends z.ZodTypeDef = z.ZodObjectDef, Input = Output>(
  schema: z.ZodType<Output, Def, Input>,
  data: FormData,
): Promise<Output> {
  const shape = getSchemaShape(schema)

  const obj = Array.from(data).reduce(
    (obj, item) => {
      if (shape == null) {
        return obj
      }

      const { typeName } = shape[item[0]]._def

      const value =
        typeName === z.ZodFirstPartyTypeKind.ZodArray ? data.getAll(item[0]).filter(Boolean) : data.get(item[0])

      if (typeof value === 'string' && value.trim().length === 0) {
        return obj
      }

      if (typeName === z.ZodFirstPartyTypeKind.ZodNumber) {
        const number = Number(value)
        if (Number.isNaN(number)) {
          return obj
        }

        return { ...obj, [item[0]]: number }
      }

      return { ...obj, [item[0]]: value }
    },
    {} as Record<string, unknown>,
  )

  try {
    return await schema.parseAsync(obj)
  } catch (exception) {
    const error = convertException(exception)
    throw fail(400, { ...obj, error })
  }
}

export type ActionFailure<T> = T & { error: string }

export type AreaActionValues = z.infer<typeof areaActionSchema>
export const areaActionSchema = z.object({
  description: z.string().nullable(),
  name: z.string(),
  type: z.enum(areaTypeEnum).default('area'),
})

export type BlockActionValues = z.infer<typeof blockActionSchema>
export const blockActionSchema = z.object({
  name: z.string(),
})

export const routeActionSchema = z.object({
  description: z.string().nullable(),
  gradeFk: z.number(),
  name: z.string(),
  rating: z.number().optional(),
  tags: z.array(z.string()).optional(),
})
export type RouteActionValues = z.infer<typeof routeActionSchema>

export const firstAscentActionSchema = z
  .object({
    climberName: z.string().optional(),
    year: z.number().optional(),
  })
  .refine((x) => x.climberName != null || x.year != null, { message: 'Either climberName or year must be set' })
export type FirstAscentActionValues = z.infer<typeof firstAscentActionSchema>

export const ascentActionSchema = z.object({
  dateTime: z.string(),
  filePaths: z.array(z.string()).optional(),
  gradeFk: z.number().optional(),
  notes: z.string().optional(),
  type: z.enum(ascentTypeEnum),
})
export type AscentActionValues = z.infer<typeof ascentActionSchema>

export const saveTopoActionSchema = z.object({
  id: z.number(),
  path: z.string(),
  routeFk: z.number(),
  topoFk: z.number(),
  topType: z.enum(topoRouteTopTypeEnum),
})
export type SaveTopoActionValues = z.infer<typeof saveTopoActionSchema>

export const addTopoActionSchema = z.object({
  routeFk: z.number(),
  topoFk: z.number(),
})
export type AddTopoActionValues = z.infer<typeof addTopoActionSchema>

export const tagActionSchema = z.object({
  id: z.string(),
})
export type TagActionValues = z.infer<typeof tagActionSchema>

export const userExternalResourceActionSchema = z.object({
  cookie8a: z.string().optional(),
  cookie27crags: z.string().optional(),
  cookieTheCrag: z.string().optional(),
})
export type UserExternalResourceActionValues = z.infer<typeof userExternalResourceActionSchema>
