import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text, type AnySQLiteColumn, primaryKey } from 'drizzle-orm/sqlite-core'

export const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
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

  userExternalResourcesFk: integer('user_external_resources_fk'),
})
export type User = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export const usersRelations = relations(users, ({ one, many }) => ({
  userExternalResources: one(userExternalResources, {
    fields: [users.userExternalResourcesFk],
    references: [userExternalResources.id],
  }),

  areas: many(areas),
  ascents: many(ascents),
  blocks: many(blocks),
  routes: many(routes),
}))

export const userExternalResources = sqliteTable('user_external_resources', {
  id: baseFields.id,

  userFk: integer('user_fk').notNull(),

  cookie8a: text('cookie_8a'),
  cookie27crags: text('cookie_27crags'),
  cookieTheCrag: text('cookie_the_crag'),
})
export type UserExternalResource = InferSelectModel<typeof userExternalResources>
export type InsertUserExternalResource = InferInsertModel<typeof userExternalResources>

export const userExternalResourcesRelations = relations(userExternalResources, ({ one }) => ({
  user: one(users, { fields: [userExternalResources.userFk], references: [users.id] }),
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
  rating: integer('rating'),

  blockFk: integer('block_fk').notNull(),
  firstAscentFk: integer('first_ascent_fk'),
  externalResourcesFk: integer('external_resources_fk'),
})
export type Route = InferSelectModel<typeof routes>
export type InsertRoute = InferInsertModel<typeof routes>

export const RoutesRelations = relations(routes, ({ one, many }) => ({
  author: one(users, { fields: [routes.createdBy], references: [users.id] }),
  block: one(blocks, { fields: [routes.blockFk], references: [blocks.id] }),
  firstAscent: one(firstAscents, { fields: [routes.firstAscentFk], references: [firstAscents.id] }),
  externalResources: one(routeExternalResources, {
    fields: [routes.externalResourcesFk],
    references: [routeExternalResources.id],
  }),

  ascents: many(ascents),
  files: many(files),
  tags: many(routesToTags),
}))

export const routeExternalResources = sqliteTable('route_external_resources', {
  id: baseFields.id,

  routeFk: integer('route_fk').notNull(),

  externalResource8aFk: integer('external_resource_8a_fk'),
  externalResource27cragsFk: integer('external_resource_27crags_fk'),
  externalResourceTheCragFk: integer('external_resource_the_crag_fk'),
})
export type RouteExternalResource = InferSelectModel<typeof routeExternalResources>
export type InsertRouteExternalResource = InferInsertModel<typeof routeExternalResources>

export const routeExternalResourcesRelations = relations(routeExternalResources, ({ one }) => ({
  route: one(routes, { fields: [routeExternalResources.routeFk], references: [routes.id] }),

  externalResource8a: one(routeExternalResource8a, {
    fields: [routeExternalResources.externalResource8aFk],
    references: [routeExternalResource8a.id],
  }),
  externalResource27crags: one(routeExternalResource27crags, {
    fields: [routeExternalResources.externalResource27cragsFk],
    references: [routeExternalResource27crags.id],
  }),
  externalResourceTheCrag: one(routeExternalResourceTheCrag, {
    fields: [routeExternalResources.externalResourceTheCragFk],
    references: [routeExternalResourceTheCrag.id],
  }),
}))

export const routeExternalResource8a = sqliteTable('route_external_resource_8a', {
  id: baseFields.id,

  zlaggableName: text('zlaggable_name'),
  zlaggableSlug: text('zlaggable_slug'),
  zlaggableId: integer('zlaggable_id'),
  cragName: text('crag_name'),
  cragSlug: text('crag_slug'),
  countrySlug: text('country_slug'),
  countryName: text('country_name'),
  areaName: text('area_name'),
  areaSlug: text('area_slug'),
  sectorName: text('sector_name'),
  sectorSlug: text('sector_slug'),
  gradeIndex: integer('grade_index'),
  type: integer('type'),
  category: integer('category'),
  averageRating: real('average_rating'),
  difficulty: text('difficulty'),

  url: text('url'),

  externalResourcesFk: integer('external_resources_fk').notNull(),
})
export type RouteExternalResource8a = InferSelectModel<typeof routeExternalResource8a>
export type InsertRouteExternalResource8a = InferInsertModel<typeof routeExternalResource8a>

export const routeExternalResource8aRelations = relations(routeExternalResource8a, ({ one }) => ({
  externalResources: one(routeExternalResources, {
    fields: [routeExternalResource8a.externalResourcesFk],
    references: [routeExternalResources.id],
  }),
}))

export const routeExternalResource27crags = sqliteTable('route_external_resource_27crags', {
  id: baseFields.id,

  name: text('name'),
  searchable_id: integer('searchable_id'),
  searchable_type: text('searchable_type'),
  country_name: text('country_name'),
  location_name: text('location_name'),
  description: text('description'),
  crag_id: integer('crag_id'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  path: text('path'),

  url: text('url'),

  externalResourcesFk: integer('external_resources_fk').notNull(),
})
export type RouteExternalResource27crags = InferSelectModel<typeof routeExternalResource27crags>
export type InsertRouteExternalResource27crags = InferInsertModel<typeof routeExternalResource27crags>

export const routeExternalResource27cragsRelations = relations(routeExternalResource27crags, ({ one }) => ({
  externalResources: one(routeExternalResources, {
    fields: [routeExternalResource27crags.externalResourcesFk],
    references: [routeExternalResources.id],
  }),
}))

export const routeExternalResourceTheCrag = sqliteTable('route_external_resource_the_crag', {
  id: baseFields.id,

  name: text('name'),
  description: text('description'),
  grade: text('grade'),
  gradingScale: text('grading_scale', { enum: ['FB', 'V'] }),
  node: integer('node'),
  rating: integer('rating'),
  tags: text('tags'),

  url: text('url'),

  externalResourcesFk: integer('external_resources_fk').notNull(),
})
export type RouteExternalResourceTheCrag = InferSelectModel<typeof routeExternalResourceTheCrag>
export type InsertRouteExternalResourceTheCrag = InferInsertModel<typeof routeExternalResourceTheCrag>

export const routeExternalResourceTheCragRelations = relations(routeExternalResourceTheCrag, ({ one }) => ({
  externalResources: one(routeExternalResources, {
    fields: [routeExternalResourceTheCrag.externalResourcesFk],
    references: [routeExternalResources.id],
  }),
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
