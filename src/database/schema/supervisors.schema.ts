import { sql, SQL } from 'drizzle-orm';
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';

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
