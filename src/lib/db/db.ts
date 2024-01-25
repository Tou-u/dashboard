import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

if (!url || !authToken) throw new Error("Turso credentials are not defined");

export const db = drizzle(createClient({ url, authToken }), { schema });
