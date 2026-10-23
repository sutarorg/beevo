import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { normalizeDatabaseUrl } from "./src/db/url";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      normalizeDatabaseUrl(process.env.DATABASE_URL) ||
      "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
  },
});
