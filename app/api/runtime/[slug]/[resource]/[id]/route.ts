import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRuntimeConfig } from "@/runtime/config-parser";
import { validateRecord } from "@/runtime/record-validator";
import { runWorkflows } from "@/runtime/workflow-engine";

async function getRecord(ownerId: string, slug: string, resource: string, id: string) {
  return prisma.runtimeRecord.findFirst({
    where: {
      id,
      ownerId,
      resource,
      app: { slug, ownerId }
    },
    include: { app: true }
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string; resource: string; id: string }> }) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const params = await context.params;
  const existing = await getRecord(user.id, params.slug, params.resource, params.id);
  if (!existing) return fail("Record not found.", 404);
  const config = parseRuntimeConfig(existing.app.config);
  const body = await request.json().catch(() => null);
  const validation = validateRecord(config, params.resource, body || {});
  if (!validation.ok) return fail("Validation failed.", 422, validation.errors);
  const record = await prisma.runtimeRecord.update({
    where: { id: existing.id },
    data: { data: validation.data as Prisma.InputJsonValue }
  });
  await runWorkflows({
    config,
    ownerId: user.id,
    appId: existing.appId,
    event: "record.updated",
    resource: params.resource,
    record: validation.data || {}
  });
  return ok(record);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string; resource: string; id: string }> }) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const params = await context.params;
  const existing = await getRecord(user.id, params.slug, params.resource, params.id);
  if (!existing) return fail("Record not found.", 404);
  await prisma.runtimeRecord.delete({ where: { id: existing.id } });
  return ok({ deleted: true });
}
