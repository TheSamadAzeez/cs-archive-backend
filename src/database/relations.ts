import { relations } from 'drizzle-orm';

import * as schema from './schema';

export const projectsRelations = relations(schema.projects, ({ one }) => ({
  student: one(schema.students, {
    fields: [schema.projects.studentId],
    references: [schema.students.id],
  }),
  supervisor: one(schema.supervisor, {
    fields: [schema.projects.supervisorId],
    references: [schema.supervisor.id],
  }),
}));

export const studentsRelations = relations(schema.students, ({ one, many }) => ({
  supervisor: one(schema.supervisor, {
    fields: [schema.students.supervisorId],
    references: [schema.supervisor.id],
  }),
  tasks: many(schema.tasks),
  projects: many(schema.projects),
}));

export const tasksRelations = relations(schema.tasks, ({ one }) => ({
  student: one(schema.students, {
    fields: [schema.tasks.studentId],
    references: [schema.students.id],
  }),
  supervisor: one(schema.supervisor, {
    fields: [schema.tasks.supervisorId],
    references: [schema.supervisor.id],
  }),
}));

export const supervisorRelations = relations(schema.supervisor, ({ many }) => ({
  students: many(schema.students),
  projects: many(schema.projects),
  tasks: many(schema.tasks),
}));
