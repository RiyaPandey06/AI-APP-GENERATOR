import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { createUser, setSessionCookie, signSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid registration payload.", 422, parsed.error.flatten());
  try {
    const user = await createUser(parsed.data.email, parsed.data.password);
    await setSessionCookie(signSession(user.id));
    return ok({ id: user.id, email: user.email }, 201);
  } catch {
    return fail("User already exists or could not be created.", 409);
  }
}
