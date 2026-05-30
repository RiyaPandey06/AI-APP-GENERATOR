import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRuntimeConfig } from "@/runtime/config-parser";
import { validateRecord } from "@/runtime/record-validator";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string; resource: string }> }) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const params = await context.params;
  const app = await prisma.appConfig.findUnique({ where: { ownerId_slug: { ownerId: user.id, slug: params.slug } } });
  if (!app) return fail("App not found.", 404);
  const config = parseRuntimeConfig(app.config);
  const body = await request.json().catch(() => null);
  const rows: Array<Record<string, unknown>> = Array.isArray(body?.rows) ? body.rows : [];
  const validRows = rows.map((row) => validateRecord(config, params.resource, row)).filter((row) => row.ok);
  if (!validRows.length) return fail("CSV import did not contain valid rows.", 422);
  await prisma.runtimeRecord.createMany({
    data: validRows.map((row) => ({
      ownerId: user.id,
      appId: app.id,
      resource: params.resource,
      data: (row.data || {}) as Prisma.InputJsonValue
    }))
  });
  return ok({ imported: validRows.length, rejected: rows.length - validRows.length }, 201);
}
