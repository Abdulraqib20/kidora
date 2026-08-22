import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/** Drizzle Kit configuration defining database schema path, output directory, and PostgreSQL dialect. */
export default defineConfig({

  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
