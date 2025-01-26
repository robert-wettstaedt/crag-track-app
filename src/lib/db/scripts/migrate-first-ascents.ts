import { eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../schema'

export const migrate = async (db: PostgresJsDatabase<typeof schema>) => {
  await db.delete(schema.routesToFirstAscensionists)
  await db.delete(schema.firstAscensionists)
  await db.update(schema.routes).set({ firstAscentYear: null })
  await db.update(schema.users).set({ firstAscensionistFk: null })

  const routes = await db.query.routes.findMany({
    with: {
      firstAscent: {
        with: {
          climber: true,
        },
      },
    },
  })

  const firstAscents = routes.map((route) => route.firstAscent)

  const allClimbers = firstAscents
    .flatMap((firstAscent) =>
      [...(firstAscent?.climberName?.split('/') ?? []), firstAscent?.climber?.username].map((name) => ({
        name: name?.trim(),
        firstAscent,
      })),
    )
    .filter(({ name }) => Boolean(name) && Number.isNaN(Number(name)) && name?.match(/\?/g)?.length !== name?.length)

  const climberMap = allClimbers.reduce(
    (obj, climber) => {
      if (
        climber.name == null ||
        climber.firstAscent == null ||
        obj[climber.name]?.some((firstAscent) => firstAscent.id === climber.firstAscent?.id)
      ) {
        return obj
      }

      return { ...obj, [climber.name]: [...(obj[climber.name] ?? []), climber.firstAscent] }
    },
    {} as Partial<Record<string, schema.FirstAscent[]>>,
  )

  await Promise.all(
    Object.entries(climberMap).map(async ([name, firstAscents]) => {
      const [newFirstAscent] = await db.insert(schema.firstAscensionists).values({ name }).returning()

      if (firstAscents == null) {
        return
      }

      await Promise.all(
        firstAscents.map(async (firstAscent) => {
          const route = routes.find((route) => route.id === firstAscent.routeFk)

          if (route == null) {
            return
          }

          await db
            .insert(schema.routesToFirstAscensionists)
            .values({ firstAscensionistFk: newFirstAscent.id, routeFk: route.id })

          await db
            .update(schema.routes)
            .set({ firstAscentYear: firstAscent.year })
            .where(eq(schema.routes.id, route.id))
        }),
      )
    }),
  )
}
