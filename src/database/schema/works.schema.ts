import { integer, pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { students } from './students.schema';
import { supervisor } from './supervisors.schema';

import { timestamps } from '../column.helpers';

export const works = pgTable('works', {
  id: serial().primaryKey(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  projectLink: text().notNull(),
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
