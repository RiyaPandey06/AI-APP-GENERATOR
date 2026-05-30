import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { setSessionCookie, signSession, verifyUser } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid login payload.", 422, parsed.error.flatten());
  const user = await verifyUser(parsed.data.email, parsed.data.password);
  if (!user) return fail("Invalid email or password.", 401);
  await setSessionCookie(signSession(user.id));
  return ok({ id: user.id, email: user.email });
}
