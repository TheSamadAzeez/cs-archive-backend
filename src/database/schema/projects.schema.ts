import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { supervisor } from './supervisors.schema';
import { students } from './students.schema';
import { timestamps } from '../column.helpers';

export const projects = pgTable('projects', {
  id: uuid().defaultRandom().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  status: varchar({ length: 50 }).notNull(),
  supervisorId: uuid()
    .notNull()
    .references(() => supervisor.id, { onDelete: 'cascade' }),
  studentId: uuid()
    .notNull()
    .references(() => students.id, {
      onDelete: 'cascade',
    }),
  ...timestamps,
});
