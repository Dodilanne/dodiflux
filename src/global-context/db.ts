import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db";
import { $env } from "../env";

export function createDbClient() {
  const client = drizzle($env.DATABASE_URL);
  return {
    client,
    ...schema,
  };
}
