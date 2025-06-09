import { sql, SQL } from 'drizzle-orm';
import { AnyPgColumn, timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  updatedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

export function lower(email: AnyPgColumn): SQL {
  return sql`lower(${email})`;
}
