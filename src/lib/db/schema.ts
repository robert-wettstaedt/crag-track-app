import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

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
  crags: many(crags),
  boulders: many(boulders),
  ascents: many(ascents),
}))

export const areas = sqliteTable('areas', {
  ...baseFields,
  ...baseContentFields,

  parentFk: integer('parent').references((): AnySQLiteColumn => areas.id),
})
export type Area = InferSelectModel<typeof areas>
export type InsertArea = InferInsertModel<typeof areas>

export const areasRelations = relations(areas, ({ one, many }) => ({
  author: one(users, { fields: [areas.createdBy], references: [users.id] }),
  parent: one(areas, { fields: [areas.parentFk], references: [areas.id], relationName: 'area-to-area' }),

  areas: many(areas, { relationName: 'area-to-area' }),
  crags: many(crags),
}))

export const crags = sqliteTable('crags', {
  ...baseFields,
  ...baseContentFields,

  lat: real('lat'),
  long: real('long'),

  areaFk: integer('parent').notNull(),
})
export type Crag = InferSelectModel<typeof crags>
export type InsertCrag = InferInsertModel<typeof crags>

export const cragsRelations = relations(crags, ({ one, many }) => ({
  area: one(areas, { fields: [crags.areaFk], references: [areas.id] }),
  author: one(users, { fields: [crags.createdBy], references: [users.id] }),

  boulders: many(boulders),
  files: many(files),
}))

export const boulders = sqliteTable('boulders', {
  ...baseFields,
  ...baseContentFields,

  grade: text('grade'),
  gradingScale: text('grading_scale', { enum: ['FB', 'V'] }).notNull(),

  cragFk: integer('parent').notNull(),
})
export type Boulder = InferSelectModel<typeof boulders>
export type InsertBoulder = InferInsertModel<typeof boulders>

export const bouldersRelations = relations(boulders, ({ one, many }) => ({
  author: one(users, { fields: [boulders.createdBy], references: [users.id] }),
  crag: one(crags, { fields: [boulders.cragFk], references: [crags.id] }),

  ascents: many(ascents),
  files: many(files),
}))

export const ascents = sqliteTable('ascents', {
  ...baseFields,
  createdBy: baseContentFields.createdBy,

  dateTime: text('date_time')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  grade: text('grade'),
  notes: text('notes'),
  type: text('type', { enum: ['flash', 'send', 'attempt'] }).notNull(),

  boulderFk: integer('boulder').notNull(),
})
export type Ascent = InferSelectModel<typeof ascents>
export type InsertAscent = InferInsertModel<typeof ascents>

export const ascentsRelations = relations(ascents, ({ one }) => ({
  author: one(users, { fields: [ascents.createdBy], references: [users.id] }),
  boulder: one(boulders, { fields: [ascents.boulderFk], references: [boulders.id] }),
}))

export const files = sqliteTable('files', {
  id: baseFields.id,

  mime: text('mime'),
  path: text('path').notNull(),
  type: text('type', { enum: ['topo', 'beta', 'attempt', 'send', 'other'] }).notNull(),

  ascentFk: integer('ascent_fk'),
  boulderFk: integer('boulder_fk'),
  cragFk: integer('crag_fk'),
})

export const filesRelations = relations(files, ({ one }) => ({
  ascent: one(ascents, { fields: [files.ascentFk], references: [ascents.id] }),
  boulder: one(boulders, { fields: [files.boulderFk], references: [boulders.id] }),
  crag: one(crags, { fields: [files.cragFk], references: [crags.id] }),
}))
export type File = InferSelectModel<typeof files>
export type InsertFile = InferInsertModel<typeof files>
