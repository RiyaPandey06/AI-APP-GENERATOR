import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRuntimeConfig } from "@/runtime/config-parser";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const apps = await prisma.appConfig.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" }
  });
  return ok(apps);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const body = await request.json().catch(() => null);
  try {
    const parsed = parseRuntimeConfig(body?.config ?? body);
    const app = await prisma.appConfig.upsert({
      where: { ownerId_slug: { ownerId: user.id, slug: parsed.slug } },
      create: {
        ownerId: user.id,
        slug: parsed.slug,
        name: parsed.name,
        config: parsed as unknown as Prisma.InputJsonValue
      },
      update: {
        name: parsed.name,
        config: parsed as unknown as Prisma.InputJsonValue
      }
    });
    return ok({ app, warnings: parsed.warnings }, 201);
  } catch {
    return fail("Malformed configuration. App was not saved.", 422);
  }
}
