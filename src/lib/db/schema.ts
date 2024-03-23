import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  lastName: text('last_name').notNull(),
})
export type User = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export const crags = sqliteTable('crags', {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
})
export type Crag = InferSelectModel<typeof crags>
export type InsertCrag = InferInsertModel<typeof crags>

export const boulders = sqliteTable('boulders', {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  grade: text('grade'),
  gradingScale: text('grading_scale', { enum: ['FB', 'V'] }),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  parent: integer('parent')
    .notNull()
    .references(() => crags.id),
})
export type Boulder = InferSelectModel<typeof boulders>
export type InsertBoulder = InferInsertModel<typeof boulders>

export const ascents = sqliteTable('ascents', {
  boulder: integer('boulder')
    .notNull()
    .references(() => boulders.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  dateTime: text('date_time')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  grade: text('grade'),
  id: integer('id').primaryKey({ autoIncrement: true }),
  notes: text('notes'),
  type: text('type', { enum: ['flash', 'send', 'attempt'] }).notNull(),
})
export type Ascent = InferSelectModel<typeof ascents>
export type InsertAscent = InferInsertModel<typeof ascents>
