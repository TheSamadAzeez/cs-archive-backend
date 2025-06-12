import { sql, SQL } from 'drizzle-orm';
import { integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { supervisor } from './supervisors.schema';

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
