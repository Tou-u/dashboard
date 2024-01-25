"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lucia, validateRequest } from "./auth";
import { generateId } from "lucia";
import { db, userTable } from "../db";
import { LibsqlError } from "@libsql/client";
import { Argon2id } from "oslo/password";
import { ActionResult } from "./form";
import { eq } from "drizzle-orm";

export async function createAccount(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const hashedPassword = await new Argon2id().hash(password);
  const userId = generateId(15);

  try {
    await db.insert(userTable).values({
      id: userId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roleId: 1,
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  } catch (e) {
    if (e instanceof LibsqlError && e.code === "SQLITE_CONSTRAINT") {
      return {
        error: "Email already used",
      };
    }
    return {
      error: "An unknown error occurred",
    };
  }
  return redirect("/");
}

export async function login(
  _: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const existingUser = await db.query.userTable.findFirst({
    where: eq(userTable.email, email),
  });
  if (!existingUser) return { error: "Incorrect email or password" };

  const validPassword = await new Argon2id().verify(
    existingUser.password,
    password,
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
