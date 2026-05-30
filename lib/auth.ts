import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const cookieName = "dynamicai_session";

function secret() {
  return process.env.JWT_SECRET || "local-dev-secret";
}

export async function createUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { email: email.toLowerCase(), passwordHash } });
}

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function signSession(userId: string) {
  return jwt.sign({ userId }, secret(), { expiresIn: "7d" });
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function getCurrentUser(request?: NextRequest) {
  const store = await cookies();
  const token = request?.cookies.get(cookieName)?.value || store.get(cookieName)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret()) as { userId: string };
    return prisma.user.findUnique({ where: { id: payload.userId } });
  } catch {
    return null;
  }
}
