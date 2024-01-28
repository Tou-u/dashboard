import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: process.env.TURSO_URL || process.env.DATABASE_URL || "",
    authToken: process.env.TURSO_TOKEN || "",
  },
  breakpoints: true,
} satisfies Config;
