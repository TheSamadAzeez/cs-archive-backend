import { sql, SQL } from 'drizzle-orm';
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';

export const admin = pgTable('admins', {
  id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  lastName: varchar({ length: 255 }).notNull(),
  firstName: varchar({ length: 255 }).notNull(),
  fullName: text().generatedAlwaysAs((): SQL => sql`${admin.firstName} || ' ' || ${admin.lastName}`),
  role: varchar({ length: 50 }).notNull().default('admin'),
  ...timestamps,
});
