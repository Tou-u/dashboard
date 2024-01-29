import { github, lucia } from "@/lib/auth";
import { db, oauthAccountTable, userTable } from "@/lib/db";
import { OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";
import { generateId } from "lucia";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const storedState = cookies().get("github_oauth_state")?.value ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser: GitHubUser = await githubUserResponse.json();

    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const emails = await emailsResponse.json();

    const primaryEmail =
      emails.find((email: { primary: string }) => email.primary) ?? null;

    if (!primaryEmail) {
      return new Response("No primary email address in your github account", {
        status: 400,
      });
    }
    if (!primaryEmail.verified) {
      return new Response("Unverified email in your github account", {
        status: 400,
      });
    }

    const existingUser = await db.query.userTable.findFirst({
      where: eq(userTable.email, primaryEmail.email),
    });

    if (existingUser) {
      await db
        .insert(oauthAccountTable)
        .values({
          providerId: "github",
          providerUserId: githubUser.id,
          userId: existingUser.id,
        })
        .onConflictDoNothing();

      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    } else {
      const userId = generateId(15);

      await db.transaction(async (tx) => {
        await tx.insert(userTable).values({
          id: userId,
          email: primaryEmail.email,
        });

        await tx.insert(oauthAccountTable).values({
          providerId: "github",
          providerUserId: githubUser.id,
          userId,
        });
      });

      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    console.log(e);
    if (
      e instanceof OAuth2RequestError &&
      e.message === "bad_verification_code"
    ) {
      // invalid code
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}

interface GitHubUser {
  id: string;
  login: string;
}
