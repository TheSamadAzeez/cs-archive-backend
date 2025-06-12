import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { students } from './students.schema';
import { supervisor } from './supervisors.schema';

export type Task = typeof tasks.$inferSelect;
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

export const taskSubmissionStatusEnum = pgEnum('task_submission_status', ['pending', 'approved', 'rejected']);
export const taskSubmissions = pgTable('task_submissions', {
  id: serial().primaryKey(),
  taskId: integer()
    .notNull()
    .references(() => tasks.id, {
      onDelete: 'cascade',
    }),
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
  link: text().notNull(),
  shortDescription: text().notNull(),
  status: taskSubmissionStatusEnum('status').notNull().default('pending'),
  feedback: text().notNull(),
  ...timestamps,
});
