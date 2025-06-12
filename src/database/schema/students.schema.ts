import { pgTable, varchar, text, serial, integer } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { relations, sql, SQL } from 'drizzle-orm';
import { supervisor } from './supervisors.schema';
import { tasks } from './tasks.schema';
import { projects } from './projects.schema';

export const students = pgTable('students', {
  id: serial().primaryKey(),
  matricNumber: varchar({ length: 255 }).notNull().unique(),
  lastName: varchar({ length: 255 }).notNull(),
  firstName: varchar({ length: 255 }).notNull(),
  fullName: text().generatedAlwaysAs(
    (): SQL => sql`${students.firstName} || ' ' || ${students.lastName}`,
  ),
  supervisorId: integer()
    .notNull()
    .references(() => supervisor.id, {
      onDelete: 'cascade',
    }),
  email: varchar({ length: 255 }).notNull().unique(),
  role: varchar({ length: 50 }).notNull().default('student'),
  ...timestamps,
});

export const studentsRelations = relations(students, ({ one, many }) => ({
  supervisor: one(supervisor, {
    fields: [students.supervisorId],
    references: [supervisor.id],
  }),
  tasks: many(tasks),
  projects: many(projects),
}));
