import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRuntimeConfig } from "@/runtime/config-parser";
import { validateRecord } from "@/runtime/record-validator";
import { runWorkflows } from "@/runtime/workflow-engine";

async function getApp(ownerId: string, slug: string) {
  return prisma.appConfig.findUnique({ where: { ownerId_slug: { ownerId, slug } } });
}

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string; resource: string }> }) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const params = await context.params;
  const app = await getApp(user.id, params.slug);
  if (!app) return fail("App not found.", 404);
  const records = await prisma.runtimeRecord.findMany({
    where: { ownerId: user.id, appId: app.id, resource: params.resource },
    orderBy: { createdAt: "desc" }
  });
  return ok(records);
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string; resource: string }> }) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const params = await context.params;
  const app = await getApp(user.id, params.slug);
  if (!app) return fail("App not found.", 404);
  const config = parseRuntimeConfig(app.config);
  const body = await request.json().catch(() => null);
  const validation = validateRecord(config, params.resource, body || {});
  if (!validation.ok) return fail("Validation failed.", 422, validation.errors);
  const record = await prisma.runtimeRecord.create({
    data: {
      ownerId: user.id,
      appId: app.id,
      resource: params.resource,
      data: validation.data as Prisma.InputJsonValue
    }
  });
  await runWorkflows({
    config,
    ownerId: user.id,
    appId: app.id,
    event: "record.created",
    resource: params.resource,
    record: validation.data || {}
  });
  return ok(record, 201);
}
