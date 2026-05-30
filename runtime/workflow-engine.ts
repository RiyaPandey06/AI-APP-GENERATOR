import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RuntimeConfig } from "@/types/runtime";

export async function runWorkflows(params: {
  config: RuntimeConfig;
  ownerId: string;
  appId: string;
  event: "record.created" | "record.updated";
  resource: string;
  record: Record<string, unknown>;
}) {
  const workflows = params.config.workflows.filter((workflow) => workflow.event === params.event && workflow.resource === params.resource);
  for (const workflow of workflows) {
    for (const action of workflow.actions) {
      if (action.type === "notification") {
        await prisma.notification.create({
          data: {
            ownerId: params.ownerId,
            title: action.title || "Workflow notification",
            body: action.body || `Workflow ran for ${params.resource}.`
          }
        });
      }
      if (action.type === "createRecord" && action.resource) {
        await prisma.runtimeRecord.create({
          data: {
            ownerId: params.ownerId,
            appId: params.appId,
            resource: action.resource,
            data: { ...action.data, sourceRecord: params.record } as Prisma.InputJsonValue
          }
        });
      }
    }
  }
}
