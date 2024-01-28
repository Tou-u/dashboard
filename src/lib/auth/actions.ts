"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lucia, validateRequest } from "./auth";
import { generateId } from "lucia";
import { db, insertUserSchema, selectUserSchema, userTable } from "../db";
import { LibsqlError } from "@libsql/client";
import { Argon2id } from "oslo/password";
import { ActionResult } from "./form";
import { eq } from "drizzle-orm";
import { parse, ValiError } from "valibot";

export async function createAccount(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const rawData = parse(
      insertUserSchema,
      Object.fromEntries(formData.entries()),
    );

    const { password, ...data } = rawData;

    const hashedPassword = await new Argon2id().hash(password);
    const userId = generateId(15);

    await db.insert(userTable).values({
      id: userId,
      password: hashedPassword,
      roleId: 1,
      ...data,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    
    return redirect("/");
  } catch (e) {
    if (e instanceof ValiError) return { error: e.message };
    if (e instanceof LibsqlError && e.code === "SQLITE_CONSTRAINT") {
      return {
        error: "Email already used",
      };
    }

    return {
      error: "An unknown error occurred",
    };
  }
}

export async function login(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const rawData = parse(
      selectUserSchema,
      Object.fromEntries(formData.entries()),
    );

    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, rawData.email),
    });
    if (!existingUser) return { error: "Incorrect email or password" };

    const validPassword = await new Argon2id().verify(
      existingUser.password,
      rawData.password,
    );
    if (!validPassword) return { error: "Incorrect email or password" };

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");
  } catch (e) {
    if (e instanceof ValiError) return { error: e.message };

    return {
      error: "An unknown error occurred",
    };
  }
}

export async function logout(): Promise<ActionResult> {
  const { session } = await validateRequest();

  if (!session) return { error: "Unauthorized" };

  await lucia.invalidateSession(session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return redirect("/login");
}
