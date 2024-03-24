import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'

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
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
}

export const users = sqliteTable('users', {
  ...baseFields,
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
})
export type User = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export const areas = sqliteTable('areas', {
  ...baseFields,
  ...baseContentFields,
  parent: integer('parent').references((): AnySQLiteColumn => areas.id),
})
export type Area = InferSelectModel<typeof areas>
export type InsertArea = InferInsertModel<typeof areas>

export const crags = sqliteTable('crags', {
  ...baseFields,
  ...baseContentFields,
  lat: text('lat'),
  long: text('long'),
  parent: integer('parent')
    .notNull()
    .references(() => areas.id),
})
export type Crag = InferSelectModel<typeof crags>
export type InsertCrag = InferInsertModel<typeof crags>

export const boulders = sqliteTable('boulders', {
  ...baseFields,
  ...baseContentFields,
  grade: text('grade'),
  gradingScale: text('grading_scale', { enum: ['FB', 'V'] }),
  parent: integer('parent')
    .notNull()
    .references(() => crags.id),
})
export type Boulder = InferSelectModel<typeof boulders>
export type InsertBoulder = InferInsertModel<typeof boulders>

export const ascents = sqliteTable('ascents', {
  ...baseFields,
  boulder: integer('boulder')
    .notNull()
    .references(() => boulders.id),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  dateTime: text('date_time')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  grade: text('grade'),
  notes: text('notes'),
  type: text('type', { enum: ['flash', 'send', 'attempt'] }).notNull(),
})
export type Ascent = InferSelectModel<typeof ascents>
export type InsertAscent = InferInsertModel<typeof ascents>
