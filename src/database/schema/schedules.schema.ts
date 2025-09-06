import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { supervisor } from './supervisors.schema';

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export const schedules = pgTable('schedules', {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  startDate: timestamp().notNull(),
  startTime: varchar({ length: 10 }).notNull(), // Format: "HH:MM"
  endDate: timestamp().notNull(),
  endTime: varchar({ length: 10 }).notNull(), // Format: "HH:MM"
  description: text(),
  color: varchar({ length: 50 }).notNull().default('blue'), // Default blue color
  supervisorId: integer()
    .notNull()
    .references(() => supervisor.id, {
      onDelete: 'cascade',
    }),
  ...timestamps,
});
