import { Lucia, type User, type Session } from "lucia";
import { db, sessionTable, userTable } from "../db";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { cache } from "react";
import { cookies } from "next/headers";
import { GitHub } from "arctic";

const database = db as unknown as LibSQLDatabase;
const adapter = new DrizzleSQLiteAdapter(database, sessionTable, userTable);

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID as string,
  process.env.GITHUB_CLIENT_SECRET as string,
);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      role: attributes.role,
    };
  },
});

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    const result = await lucia.validateSession(sessionId);

    try {
      if (result.session?.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {}
    return result;
  },
);

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
  }
}
