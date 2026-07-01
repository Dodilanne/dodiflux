import { defineConfig } from "drizzle-kit";
import { $env } from "./src/env";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db.ts",
  dbCredentials: { url: $env.DATABASE_URL },
});
