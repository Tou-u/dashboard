import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Production
const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

// Development
const localdb = process.env.DATABASE_URL

let client = null

if(url && authToken) {
    client = createClient({url, authToken})
} else if (localdb) {
    client = createClient({url: localdb})
} else {
    throw new Error('Credentials not provided')
}

export const db = drizzle(client, {schema})
