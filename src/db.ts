import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const records = sqliteTable("records", {
  id: integer().primaryKey({ autoIncrement: true }),
  value: integer().notNull(),
  created_at: text()
    .$defaultFn(() => new Date().toISOString())
    .notNull(),
});
