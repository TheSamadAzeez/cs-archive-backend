import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { supervisor } from './supervisors.schema';
import { students } from './students.schema';
import { relations } from 'drizzle-orm';

import { timestamps } from '../column.helpers';

export const ProjectStatusEnum = pgEnum('project_status', [
  'In Progress',
  'Under Review',
  'Completed',
]);

export const projects = pgTable('projects', {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  status: ProjectStatusEnum().notNull().default('In Progress'),
  startDate: timestamp().notNull(),
  progressBar: integer().notNull().default(0),
  supervisorId: integer()
    .notNull()
    .references(() => supervisor.id, { onDelete: 'cascade' }),
  studentId: integer()
    .notNull()
    .references(() => students.id, {
      onDelete: 'cascade',
    }),
  ...timestamps,
});

export const projectsRelations = relations(projects, ({ one }) => ({
  student: one(students, {
    fields: [projects.studentId],
    references: [students.id],
  }),
  supervisor: one(supervisor, {
    fields: [projects.supervisorId],
    references: [supervisor.id],
  }),
}));
