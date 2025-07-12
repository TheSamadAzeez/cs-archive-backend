import { pgTable, serial, varchar, text, boolean, integer } from 'drizzle-orm/pg-core';
import { timestamps } from '../column.helpers';

export const notifications = pgTable('notifications', {
  id: serial().primaryKey(),
  userId: integer().notNull(),
  userType: varchar({ length: 50 }).notNull(),
  type: varchar({ length: 100 }).notNull(),
  title: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  isRead: boolean().default(false),
  relatedId: integer(),
  relatedType: varchar({ length: 50 }),
  ...timestamps,
});
