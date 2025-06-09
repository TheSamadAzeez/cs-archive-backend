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

export const supervisor = pgTable(
  'supervisor',
  {
    id: uuid().defaultRandom().primaryKey(),
    email: varchar({ length: 255 }).notNull().unique(),
    lastname: varchar({ length: 255 }).notNull(),
    firstname: varchar({ length: 255 }).notNull(),
    fullname: text().generatedAlwaysAs(
      (): SQL => sql`${supervisor.firstname} || ' ' || ${supervisor.lastname}`,
    ),
    active: boolean().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex('email').on(t.email)],
);
