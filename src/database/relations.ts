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
  project: one(schema.projects, {
    fields: [schema.students.id],
    references: [schema.projects.studentId],
  }),
}));

export const tasksRelations = relations(schema.tasks, ({ one, many }) => ({
  student: one(schema.students, {
    fields: [schema.tasks.studentId],
    references: [schema.students.id],
  }),
  supervisor: one(schema.supervisor, {
    fields: [schema.tasks.supervisorId],
    references: [schema.supervisor.id],
  }),
  taskSubmissions: many(schema.taskSubmissions),
}));

export const taskSubmissionsRelations = relations(schema.taskSubmissions, ({ one }) => ({
  task: one(schema.tasks, {
    fields: [schema.taskSubmissions.taskId],
    references: [schema.tasks.id],
  }),
  student: one(schema.students, {
    fields: [schema.taskSubmissions.studentId],
    references: [schema.students.id],
  }),
  supervisor: one(schema.supervisor, {
    fields: [schema.taskSubmissions.supervisorId],
    references: [schema.supervisor.id],
  }),
}));

export const supervisorRelations = relations(schema.supervisor, ({ many }) => ({
  students: many(schema.students),
  projects: many(schema.projects),
  tasks: many(schema.tasks),
}));
