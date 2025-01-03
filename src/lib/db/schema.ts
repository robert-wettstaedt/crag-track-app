import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgPolicy as policy,
  primaryKey,
  real,
  serial,
  pgTable as table,
  text,
  uuid,
  type AnyPgColumn as AnyColumn,
  type PgPolicyConfig,
} from 'drizzle-orm/pg-core'
import { authUsers, supabaseAuthAdminRole } from 'drizzle-orm/supabase'
import { EDIT_PERMISSION, READ_PERMISSION } from '../auth'
import { createBasicTablePolicies, getAuthorizedPolicyConfig, getOwnEntryPolicyConfig, getPolicyConfig } from './policy'

export const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD') // Normalize the string
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .trim() // Trim whitespace from both ends
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-|-$/g, '') // Remove leading and trailing hyphens

const baseFields = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  id: serial('id').primaryKey(),
}

const baseContentFields = {
  createdBy: integer('created_by').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
}

const READ_AUTH_ADMIN_POLICY_CONFIG: PgPolicyConfig = {
  as: 'permissive',
  for: 'select',
  to: supabaseAuthAdminRole,
  using: sql`true`,
}

export const appPermission = pgEnum('app_permission', [READ_PERMISSION, EDIT_PERMISSION])
export const appRole = pgEnum('app_role', ['user', 'maintainer'])

export const userRoles = table(
  'user_roles',
  {
    id: baseFields.id,
    authUserFk: uuid('auth_user_fk').notNull(),
    role: appRole().notNull(),
  },
  () => [
    policy('auth admins can read user_roles', READ_AUTH_ADMIN_POLICY_CONFIG),
    policy(`users can read own user_roles`, getOwnEntryPolicyConfig('select')),
  ],
).enableRLS()

export const rolePermissions = table(
  'role_permissions',
  {
    id: baseFields.id,
    role: appRole().notNull(),
    permission: appPermission().notNull(),
  },
  () => [policy('Authenticated users can read role_permissions', getPolicyConfig('select', sql`true`))],
)

export const users = table(
  'users',
  {
    ...baseFields,
    username: text('username').notNull(),
    authUserFk: uuid('auth_user_fk').notNull(),
    userSettingsFk: integer('user_settings_fk'),
  },
  (table) => [
    policy(`${READ_PERMISSION} can read users`, getAuthorizedPolicyConfig('select', READ_PERMISSION)),
    index('users_auth_user_fk_idx').on(table.authUserFk),
    index('users_username_idx').on(table.username),
  ],
).enableRLS()
export type User = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export const usersRelations = relations(users, ({ one, many }) => ({
  authUser: one(authUsers, { fields: [users.authUserFk], references: [authUsers.id] }),
  userSettings: one(userSettings, { fields: [users.userSettingsFk], references: [userSettings.id] }),

  areas: many(areas),
  ascents: many(ascents),
  blocks: many(blocks),
  routes: many(routes),
}))

export const userSettings = table(
  'user_settings',
  {
    id: baseFields.id,

    authUserFk: uuid('auth_user_fk').notNull(),
    userFk: integer('user_fk').notNull(),

    cookie8a: text('cookie_8a'),
    cookie27crags: text('cookie_27crags'),
    cookieTheCrag: text('cookie_the_crag'),

    gradingScale: text('grading_scale', { enum: ['FB', 'V'] })
      .notNull()
      .default('FB'),
  },
  (table) => [
    policy(`users can create own users_settings`, getOwnEntryPolicyConfig('insert')),
    policy(`users can read own users_settings`, getOwnEntryPolicyConfig('select')),
    policy(`users can update own users_settings`, getOwnEntryPolicyConfig('update')),
    index('user_settings_auth_user_fk_idx').on(table.authUserFk),
    index('user_settings_user_fk_idx').on(table.userFk),
  ],
).enableRLS()
export type UserSettings = InferSelectModel<typeof userSettings>
export type InsertUserSettings = InferInsertModel<typeof userSettings>

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  authUser: one(authUsers, { fields: [userSettings.authUserFk], references: [authUsers.id] }),
  user: one(users, { fields: [userSettings.userFk], references: [users.id] }),
}))

export const areaTypeEnum: ['area', 'crag', 'sector'] = ['area', 'crag', 'sector']
export const areas = table(
  'areas',
  {
    ...baseFields,
    ...baseContentFields,

    description: text('description'),
    type: text('type', { enum: areaTypeEnum }).notNull().default('area'),

    parentFk: integer('parent_fk').references((): AnyColumn => areas.id),
  },
  (table) => [...createBasicTablePolicies('areas'), index('areas_slug_idx').on(table.slug)],
).enableRLS()
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

export const blocks = table(
  'blocks',
  {
    ...baseFields,
    ...baseContentFields,

    areaFk: integer('area_fk').notNull(),
    geolocationFk: integer('geolocation_fk'),
  },
  (table) => [...createBasicTablePolicies('blocks'), index('blocks_slug_idx').on(table.slug)],
).enableRLS()
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

export const routes = table(
  'routes',
  {
    ...baseFields,
    ...baseContentFields,

    description: text('description'),
    rating: integer('rating'),

    blockFk: integer('block_fk').notNull(),
    firstAscentFk: integer('first_ascent_fk'),
    externalResourcesFk: integer('external_resources_fk'),
    gradeFk: integer('grade_fk'),
  },
  (table) => [
    ...createBasicTablePolicies('routes'),
    index('routes_slug_idx').on(table.slug),
    index('routes_block_fk_idx').on(table.blockFk),
  ],
).enableRLS()
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
  grade: one(grades, { fields: [routes.gradeFk], references: [grades.id] }),

  ascents: many(ascents),
  files: many(files),
  tags: many(routesToTags),
}))

export const grades = table(
  'grades',
  {
    id: baseFields.id,

    FB: text('FB'),
    V: text('V'),
  },
  () => [policy('Authenticated users can fully access grades', getPolicyConfig('all', sql`true`))],
).enableRLS()
export type Grade = InferSelectModel<typeof grades>
export type InsertGrade = InferInsertModel<typeof grades>

export const GradesRelations = relations(grades, ({ many }) => ({
  ascents: many(ascents),
  routes: many(routes),
}))

export const routeExternalResources = table(
  'route_external_resources',
  {
    id: baseFields.id,

    routeFk: integer('route_fk').notNull(),

    externalResource8aFk: integer('external_resource_8a_fk'),
    externalResource27cragsFk: integer('external_resource_27crags_fk'),
    externalResourceTheCragFk: integer('external_resource_the_crag_fk'),
  },

  (table) => [
    ...createBasicTablePolicies('route_external_resources'),
    index('route_external_resources_route_fk_idx').on(table.routeFk),
  ],
).enableRLS()
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

export const routeExternalResource8a = table(
  'route_external_resource_8a',
  {
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
  },
  () => createBasicTablePolicies('route_external_resource_8a'),
).enableRLS()
export type RouteExternalResource8a = InferSelectModel<typeof routeExternalResource8a>
export type InsertRouteExternalResource8a = InferInsertModel<typeof routeExternalResource8a>

export const routeExternalResource8aRelations = relations(routeExternalResource8a, ({ one }) => ({
  externalResources: one(routeExternalResources, {
    fields: [routeExternalResource8a.externalResourcesFk],
    references: [routeExternalResources.id],
  }),
}))

export const routeExternalResource27crags = table(
  'route_external_resource_27crags',
  {
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
  },
  () => createBasicTablePolicies('route_external_resource_27crags'),
).enableRLS()
export type RouteExternalResource27crags = InferSelectModel<typeof routeExternalResource27crags>
export type InsertRouteExternalResource27crags = InferInsertModel<typeof routeExternalResource27crags>

export const routeExternalResource27cragsRelations = relations(routeExternalResource27crags, ({ one }) => ({
  externalResources: one(routeExternalResources, {
    fields: [routeExternalResource27crags.externalResourcesFk],
    references: [routeExternalResources.id],
  }),
}))

export const routeExternalResourceTheCrag = table(
  'route_external_resource_the_crag',
  {
    id: baseFields.id,

    name: text('name'),
    description: text('description'),
    grade: text('grade'),
    node: bigint('node', { mode: 'number' }),
    rating: integer('rating'),
    tags: text('tags'),

    url: text('url'),

    externalResourcesFk: integer('external_resources_fk').notNull(),
  },
  () => createBasicTablePolicies('route_external_resource_the_crag'),
).enableRLS()
export type RouteExternalResourceTheCrag = InferSelectModel<typeof routeExternalResourceTheCrag>
export type InsertRouteExternalResourceTheCrag = InferInsertModel<typeof routeExternalResourceTheCrag>

export const routeExternalResourceTheCragRelations = relations(routeExternalResourceTheCrag, ({ one }) => ({
  externalResources: one(routeExternalResources, {
    fields: [routeExternalResourceTheCrag.externalResourcesFk],
    references: [routeExternalResources.id],
  }),
}))

export const firstAscents = table(
  'first_ascents',
  {
    id: baseFields.id,

    climberName: text('climber_name'),
    year: integer('year'),

    routeFk: integer('route_fk').notNull(),
    climberFk: integer('climber_fk'),
  },
  (table) => [...createBasicTablePolicies('first_ascents'), index('first_ascents_route_fk_idx').on(table.routeFk)],
).enableRLS()

export type FirstAscent = InferSelectModel<typeof firstAscents>
export type InsertFirstAscent = InferInsertModel<typeof firstAscents>

export const firstAscentsRelations = relations(firstAscents, ({ one }) => ({
  climber: one(users, { fields: [firstAscents.climberFk], references: [users.id] }),
  route: one(routes, { fields: [firstAscents.routeFk], references: [routes.id] }),
}))

export const ascentTypeEnum: ['flash', 'send', 'repeat', 'attempt'] = ['flash', 'send', 'repeat', 'attempt']
export const ascents = table(
  'ascents',
  {
    ...baseFields,
    createdBy: baseContentFields.createdBy,

    dateTime: text('date_time')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    notes: text('notes'),
    type: text('type', { enum: ascentTypeEnum }).notNull(),

    gradeFk: integer('grade_fk'),
    routeFk: integer('route_fk').notNull(),
  },
  (table) => [
    policy(`${READ_PERMISSION} can create ascents`, getAuthorizedPolicyConfig('insert', READ_PERMISSION)),
    policy(`${READ_PERMISSION} can read ascents`, getAuthorizedPolicyConfig('select', READ_PERMISSION)),
    policy(
      `${READ_PERMISSION} can update their own ascents`,
      getPolicyConfig(
        'update',
        sql.raw(`
          EXISTS (
            SELECT
              1
            FROM
              public.users u
            WHERE
              u.id = created_by
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        `),
      ),
    ),
    policy(
      `${READ_PERMISSION} can delete their own ascents`,
      getPolicyConfig(
        'delete',
        sql.raw(`
          EXISTS (
            SELECT
              1
            FROM
              public.users u
            WHERE
              u.id = created_by
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        `),
      ),
    ),
    policy(`${EDIT_PERMISSION} can fully access ascents`, getAuthorizedPolicyConfig('all', EDIT_PERMISSION)),
    index('ascents_created_by_idx').on(table.createdBy),
    index('ascents_route_fk_idx').on(table.routeFk),
  ],
).enableRLS()
export type Ascent = InferSelectModel<typeof ascents>
export type InsertAscent = InferInsertModel<typeof ascents>

export const ascentsRelations = relations(ascents, ({ one, many }) => ({
  author: one(users, { fields: [ascents.createdBy], references: [users.id] }),
  grade: one(grades, { fields: [ascents.gradeFk], references: [grades.id] }),
  route: one(routes, { fields: [ascents.routeFk], references: [routes.id] }),

  files: many(files),
}))

export const files = table(
  'files',
  {
    id: baseFields.id,

    path: text('path').notNull(),
    type: text('type', { enum: ['topo', 'beta', 'attempt', 'send', 'other'] }).notNull(),

    areaFk: integer('area_fk'),
    ascentFk: integer('ascent_fk'),
    routeFk: integer('route_fk'),
    blockFk: integer('block_fk'),
  },
  (table) => [
    policy(`${READ_PERMISSION} can create files`, getAuthorizedPolicyConfig('insert', READ_PERMISSION)),
    policy(`${READ_PERMISSION} can read files`, getAuthorizedPolicyConfig('select', READ_PERMISSION)),
    policy(
      `${READ_PERMISSION} can update files belonging to their own ascents`,
      getPolicyConfig(
        'update',
        sql.raw(`
          EXISTS (
            SELECT
              1
            FROM
              public.ascents a
              JOIN public.users u ON a.created_by = u.id
            WHERE
              a.id = ascent_fk
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        `),
      ),
    ),
    policy(
      `${READ_PERMISSION} can delete files belonging to their own ascents`,
      getPolicyConfig(
        'delete',
        sql.raw(`
          EXISTS (
            SELECT
              1
            FROM
              public.ascents a
              JOIN public.users u ON a.created_by = u.id
            WHERE
              a.id = ascent_fk
              AND u.auth_user_fk = (SELECT auth.uid())
          )
        `),
      ),
    ),
    policy(`${EDIT_PERMISSION} can fully access files`, getAuthorizedPolicyConfig('all', EDIT_PERMISSION)),
    index('files_area_fk_idx').on(table.areaFk),
    index('files_ascent_fk_idx').on(table.ascentFk),
    index('files_block_fk_idx').on(table.blockFk),
    index('files_route_fk_idx').on(table.routeFk),
    index('files_type_idx').on(table.type),
  ],
).enableRLS()
export type File = InferSelectModel<typeof files>
export type InsertFile = InferInsertModel<typeof files>

export const filesRelations = relations(files, ({ one }) => ({
  area: one(areas, { fields: [files.areaFk], references: [areas.id] }),
  ascent: one(ascents, { fields: [files.ascentFk], references: [ascents.id] }),
  block: one(blocks, { fields: [files.blockFk], references: [blocks.id] }),
  route: one(routes, { fields: [files.routeFk], references: [routes.id] }),
}))

export const topos = table(
  'topos',
  {
    id: baseFields.id,

    blockFk: integer('block_fk'),
    fileFk: integer('file_fk'),
  },
  (table) => [...createBasicTablePolicies('topos'), index('topos_block_fk_idx').on(table.blockFk)],
).enableRLS()
export type Topo = InferSelectModel<typeof topos>
export type InsertTopo = InferInsertModel<typeof topos>

export const toposRelations = relations(topos, ({ one, many }) => ({
  block: one(blocks, { fields: [topos.blockFk], references: [blocks.id] }),
  file: one(files, { fields: [topos.fileFk], references: [files.id] }),

  routes: many(topoRoutes),
}))

export const topoRouteTopTypeEnum: ['top', 'topout'] = ['top', 'topout']
export const topoRoutes = table(
  'topo_routes',
  {
    id: baseFields.id,

    topType: text('top_type', { enum: topoRouteTopTypeEnum }).notNull(),
    path: text('path'),

    routeFk: integer('route_fk'),
    topoFk: integer('topo_fk'),
  },
  (table) => [
    ...createBasicTablePolicies('topo_routes'),
    index('topo_routes_route_fk_idx').on(table.routeFk),
    index('topo_routes_topo_fk_idx').on(table.topoFk),
  ],
).enableRLS()
export type TopoRoute = InferSelectModel<typeof topoRoutes>
export type InsertTopoRoute = InferInsertModel<typeof topoRoutes>

export const topoRoutesRelations = relations(topoRoutes, ({ one }) => ({
  route: one(routes, { fields: [topoRoutes.routeFk], references: [routes.id] }),
  topo: one(topos, { fields: [topoRoutes.topoFk], references: [topos.id] }),
}))

export const tags = table(
  'tags',
  {
    id: text('id').primaryKey(),
  },
  () => createBasicTablePolicies('tags'),
).enableRLS()
export type Tag = InferSelectModel<typeof tags>
export type InsertTag = InferInsertModel<typeof tags>

export const tagsRelations = relations(tags, ({ many }) => ({
  routes: many(routesToTags),
}))

export const routesToTags = table(
  'routes_to_tags',
  {
    routeFk: integer('route_fk')
      .notNull()
      .references(() => routes.id),
    tagFk: text('tag_fk')
      .notNull()
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.routeFk, table.tagFk] }), ...createBasicTablePolicies('routes_to_tags')],
).enableRLS()

export const routesToTagsRelations = relations(routesToTags, ({ one }) => ({
  route: one(routes, { fields: [routesToTags.routeFk], references: [routes.id] }),
  tag: one(tags, { fields: [routesToTags.tagFk], references: [tags.id] }),
}))

export const geolocations = table(
  'geolocations',
  {
    id: baseFields.id,

    lat: real('lat').notNull(),
    long: real('long').notNull(),

    areaFk: integer('area_fk'),
    blockFk: integer('block_fk'),
  },
  (table) => [
    ...createBasicTablePolicies('geolocations'),
    index('geolocations_area_fk_idx').on(table.areaFk),
    index('geolocations_block_fk_idx').on(table.blockFk),
  ],
).enableRLS()
export type Geolocation = InferSelectModel<typeof geolocations>
export type InsertGeolocation = InferInsertModel<typeof geolocations>

export const geolocationsRelations = relations(geolocations, ({ one }) => ({
  area: one(areas, { fields: [geolocations.areaFk], references: [areas.id] }),
  block: one(blocks, { fields: [geolocations.blockFk], references: [blocks.id] }),
}))
