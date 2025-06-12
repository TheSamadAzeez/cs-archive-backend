import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { students } from './students.schema';
import { supervisor } from './supervisors.schema';
import { relations } from 'drizzle-orm';

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

export const tasksRelations = relations(tasks, ({ one }) => ({
  student: one(students, {
    fields: [tasks.studentId],
    references: [students.id],
  }),
  supervisor: one(supervisor, {
    fields: [tasks.supervisorId],
    references: [supervisor.id],
  }),
}));
