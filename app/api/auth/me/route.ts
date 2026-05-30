import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  return ok({ id: user.id, email: user.email });
}
