import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return fail("Authentication required.", 401);
  const notifications = await prisma.notification.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return ok(notifications);
}
