import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { students } from './students.schema';
import { supervisor } from './supervisors.schema';

export const tasks = pgTable('tasks', {
  id: serial().primaryKey(),
  task: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  dueDate: timestamp().notNull(),
  status: varchar({ length: 50 }).notNull(),
  actions: text().notNull(),
  studentId: integer()
    .notNull()
    .references(() => students.id, {
      onDelete: 'cascade',
    }),
  supervisorId: integer()
    .notNull()
    .references(() => supervisor.id, {
      onDelete: 'cascade',
    }),
  ...timestamps,
});

export const tasksStatusUpdate = pgTable('tasks_status_update', {
  id: serial().primaryKey(),
  taskId: integer()
    .notNull()
    .references(() => tasks.id, {
      onDelete: 'cascade',
    }),
  status: varchar({ length: 50 }).notNull(),
  ...timestamps,
});
