import { pgTable, varchar, text, serial } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { relations, sql, SQL } from 'drizzle-orm';
import { students } from './students.schema';
import { projects } from './projects.schema';
import { tasks } from './tasks.schema';

export const supervisor = pgTable('supervisors', {
  id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  lastname: varchar({ length: 255 }).notNull(),
  firstname: varchar({ length: 255 }).notNull(),
  fullname: text().generatedAlwaysAs(
    (): SQL => sql`${supervisor.firstname} || ' ' || ${supervisor.lastname}`,
  ),
  role: varchar({ length: 50 }).notNull().default('supervisor'),
  ...timestamps,
});

export const supervisorRelations = relations(supervisor, ({ many }) => ({
  students: many(students),
  projects: many(projects),
  tasks: many(tasks),
}));
