import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const params = await context.params;
  const app = await prisma.appConfig.findUnique({
    where: { ownerId_slug: { ownerId: user.id, slug: params.slug } }
  });
  if (!app) return fail("App not found.", 404);
  return ok(app);
}
