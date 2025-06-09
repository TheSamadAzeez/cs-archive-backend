import {
  pgTable,
  varchar,
  text,
  boolean,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';
import { sql, SQL } from 'drizzle-orm';

export const students = pgTable(
  'students',
  {
    id: uuid().defaultRandom().primaryKey(),
    matricNumber: varchar({ length: 255 }).notNull().unique(),
    surname: varchar({ length: 255 }).notNull(),
    fullName: text().generatedAlwaysAs(
      (): SQL => sql`${students.matricNumber} || ' ' || ${students.surname}`,
    ),
    active: boolean().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex('matric_number_unique').on(t.matricNumber)],
);
