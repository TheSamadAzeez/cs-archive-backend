import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { students } from './students.schema';
import { supervisor } from './supervisors.schema';

export const refreshStudentTokens = pgTable('refresh_student_tokens', {
  id: serial().primaryKey(),
  token: text().notNull().unique(),
  userId: integer()
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  revoked: boolean().default(false),
  expiresAt: timestamp().notNull(),
  ...timestamps,
});

export const refreshSupervisorTokens = pgTable('refresh_supervisor_tokens', {
  id: serial().primaryKey(),
  token: text().notNull().unique(),
  userId: integer()
    .notNull()
    .references(() => supervisor.id, { onDelete: 'cascade' }),
  revoked: boolean().default(false),
  expiresAt: timestamp().notNull(),
  ...timestamps,
});

export const refreshAdminTokens = pgTable('refresh_admin_tokens', {
  id: serial().primaryKey(),
  token: text().notNull().unique(),
  userId: integer()
    .notNull()
    .references(() => supervisor.id, { onDelete: 'cascade' }),
  revoked: boolean().default(false),
  expiresAt: timestamp().notNull(),
  ...timestamps,
});
