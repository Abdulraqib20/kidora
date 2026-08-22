import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL?.replace("sslmode=require", "sslmode=verify-full");
const pool = new Pool({ connectionString });

/** Database client instance wrapping node-postgres pool with Drizzle ORM schema. */
export const db = drizzle(pool, { schema });
export { pool, schema };

