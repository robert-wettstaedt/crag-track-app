import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text, type AnySQLiteColumn, primaryKey } from 'drizzle-orm/sqlite-core'

export const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')

const baseFields = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  id: integer('id').primaryKey({ autoIncrement: true }),
}

const baseContentFields = {
  createdBy: integer('created_by').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
}

export const users = sqliteTable('users', {
  ...baseFields,

  email: text('email').notNull(),
  userName: text('user_name').notNull(),
})
export type User = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export const usersRelations = relations(users, ({ many }) => ({
  areas: many(areas),
  ascents: many(ascents),
  blocks: many(blocks),
  routes: many(routes),
}))

export const areas = sqliteTable('areas', {
  ...baseFields,
  ...baseContentFields,

  type: text('type', { enum: ['area', 'crag', 'sector'] })
    .notNull()
    .default('area'),

  parentFk: integer('parent_fk').references((): AnySQLiteColumn => areas.id),
})
export type Area = InferSelectModel<typeof areas>
export type InsertArea = InferInsertModel<typeof areas>

export const areasRelations = relations(areas, ({ one, many }) => ({
  author: one(users, { fields: [areas.createdBy], references: [users.id] }),
  parent: one(areas, { fields: [areas.parentFk], references: [areas.id], relationName: 'area-to-area' }),

  areas: many(areas, { relationName: 'area-to-area' }),
  blocks: many(blocks),
  files: many(files),
  parkingLocations: many(geolocations),
}))

export const blocks = sqliteTable('blocks', {
  ...baseFields,
  ...baseContentFields,

  areaFk: integer('area_fk').notNull(),
  geolocationFk: integer('geolocation_fk'),
})
export type Block = InferSelectModel<typeof blocks>
export type InsertBlock = InferInsertModel<typeof blocks>

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  area: one(areas, { fields: [blocks.areaFk], references: [areas.id] }),
  author: one(users, { fields: [blocks.createdBy], references: [users.id] }),
  geolocation: one(geolocations, { fields: [blocks.geolocationFk], references: [geolocations.id] }),

  files: many(files),
  routes: many(routes),
  topos: many(topos),
}))

export const routes = sqliteTable('routes', {
  ...baseFields,
  ...baseContentFields,

  description: text('description'),
  grade: text('grade'),
  gradingScale: text('grading_scale', { enum: ['FB', 'V'] }).notNull(),

  blockFk: integer('block_fk').notNull(),
  firstAscentFk: integer('first_ascent_fk'),
})
export type Route = InferSelectModel<typeof routes>
export type InsertRoute = InferInsertModel<typeof routes>

export const RoutesRelations = relations(routes, ({ one, many }) => ({
  author: one(users, { fields: [routes.createdBy], references: [users.id] }),
  block: one(blocks, { fields: [routes.blockFk], references: [blocks.id] }),
  firstAscent: one(firstAscents, { fields: [routes.firstAscentFk], references: [firstAscents.id] }),

  ascents: many(ascents),
  files: many(files),
  tags: many(routesToTags),
}))

export const firstAscents = sqliteTable('first_ascents', {
  id: baseFields.id,

  climberName: text('climber_name'),
  year: integer('year'),

  routeFk: integer('route_fk').notNull(),
  climberFk: integer('climber_fk'),
})

export type FirstAscent = InferSelectModel<typeof firstAscents>
export type InsertFirstAscent = InferInsertModel<typeof firstAscents>

export const firstAscentsRelations = relations(firstAscents, ({ one }) => ({
  climber: one(users, { fields: [firstAscents.climberFk], references: [users.id] }),
  route: one(routes, { fields: [firstAscents.routeFk], references: [routes.id] }),
}))

export const ascents = sqliteTable('ascents', {
  ...baseFields,
  createdBy: baseContentFields.createdBy,

  dateTime: text('date_time')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  grade: text('grade'),
  notes: text('notes'),
  type: text('type', { enum: ['flash', 'send', 'repeat', 'attempt'] }).notNull(),

  routeFk: integer('route_fk').notNull(),
})
export type Ascent = InferSelectModel<typeof ascents>
export type InsertAscent = InferInsertModel<typeof ascents>

export const ascentsRelations = relations(ascents, ({ one, many }) => ({
  author: one(users, { fields: [ascents.createdBy], references: [users.id] }),
  route: one(routes, { fields: [ascents.routeFk], references: [routes.id] }),

  files: many(files),
}))

export const files = sqliteTable('files', {
  id: baseFields.id,

  path: text('path').notNull(),
  type: text('type', { enum: ['topo', 'beta', 'attempt', 'send', 'other'] }).notNull(),

  areaFk: integer('area_fk'),
  ascentFk: integer('ascent_fk'),
  routeFk: integer('route_fk'),
  blockFk: integer('block_fk'),
})
export type File = InferSelectModel<typeof files>
export type InsertFile = InferInsertModel<typeof files>

export const filesRelations = relations(files, ({ one }) => ({
  area: one(areas, { fields: [files.areaFk], references: [areas.id] }),
  ascent: one(ascents, { fields: [files.ascentFk], references: [ascents.id] }),
  block: one(blocks, { fields: [files.blockFk], references: [blocks.id] }),
  route: one(routes, { fields: [files.routeFk], references: [routes.id] }),
}))

export const topos = sqliteTable('topos', {
  id: baseFields.id,

  blockFk: integer('block_fk'),
  fileFk: integer('file_fk'),
})
export type Topo = InferSelectModel<typeof topos>
export type InsertTopo = InferInsertModel<typeof topos>

export const toposRelations = relations(topos, ({ one, many }) => ({
  block: one(blocks, { fields: [topos.blockFk], references: [blocks.id] }),
  file: one(files, { fields: [topos.fileFk], references: [files.id] }),

  routes: many(topoRoutes),
}))

export const topoRoutes = sqliteTable('topo_routes', {
  id: baseFields.id,

  topType: text('top_type', { enum: ['top', 'topout'] }).notNull(),
  path: text('path'),

  routeFk: integer('route_fk'),
  topoFk: integer('topo_fk'),
})
export type TopoRoute = InferSelectModel<typeof topoRoutes>
export type InsertTopoRoute = InferInsertModel<typeof topoRoutes>

export const topoRoutesRelations = relations(topoRoutes, ({ one }) => ({
  route: one(routes, { fields: [topoRoutes.routeFk], references: [routes.id] }),
  topo: one(topos, { fields: [topoRoutes.topoFk], references: [topos.id] }),
}))

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
})
export type Tag = InferSelectModel<typeof tags>
export type InsertTag = InferInsertModel<typeof tags>

export const tagsRelations = relations(tags, ({ many }) => ({
  routes: many(routesToTags),
}))

export const routesToTags = sqliteTable(
  'routes_to_tags',
  {
    routeFk: integer('route_fk')
      .notNull()
      .references(() => routes.id),
    tagFk: text('tag_fk')
      .notNull()
      .references(() => tags.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.routeFk, t.tagFk] }),
  }),
)

export const routesToTagsRelations = relations(routesToTags, ({ one }) => ({
  route: one(routes, { fields: [routesToTags.routeFk], references: [routes.id] }),
  tag: one(tags, { fields: [routesToTags.tagFk], references: [tags.id] }),
}))

export const geolocations = sqliteTable('geolocations', {
  id: baseFields.id,

  lat: real('lat').notNull(),
  long: real('long').notNull(),

  areaFk: integer('area_fk'),
  blockFk: integer('block_fk'),
})
export type Geolocation = InferSelectModel<typeof geolocations>
export type InsertGeolocation = InferInsertModel<typeof geolocations>

export const geolocationsRelations = relations(geolocations, ({ one }) => ({
  area: one(areas, { fields: [geolocations.areaFk], references: [areas.id] }),
  block: one(blocks, { fields: [geolocations.blockFk], references: [blocks.id] }),
}))
