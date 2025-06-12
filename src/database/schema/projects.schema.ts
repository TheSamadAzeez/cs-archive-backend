import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { students } from './students.schema';
import { supervisor } from './supervisors.schema';

import { timestamps } from '../column.helpers';

export type ProjectStatus = (typeof ProjectStatusEnum.enumValues)[number];
export const ProjectStatusEnum = pgEnum('project_status', [
  'Not Started',
  'In Progress',
  'Completed',
]);

export const projects = pgTable('projects', {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  status: ProjectStatusEnum().notNull().default('Not Started'),
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

export const projectStatusUpdate = pgTable('project_status_update', {
  id: serial().primaryKey(),
  projectId: integer()
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  status: ProjectStatusEnum().notNull(),
  updatedBy: varchar({ length: 255 }).notNull(),
  ...timestamps,
});
