"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  deleteSession,
  getCurrentUser,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "./auth";
import { prisma } from "./db";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    throw new Error("La password deve avere almeno 8 caratteri.");
  }

  return password;
}

export async function register(formData: FormData) {
  const name = readText(formData, "name");
  const email = normalizeEmail(readText(formData, "email"));
  const password = readPassword(formData);

  if (!name) {
    throw new Error("Il nome è obbligatorio.");
  }

  if (!email) {
    throw new Error("Inserisci un nome utente o un'email valida.");
  }

  const userCount = await prisma.user.count();

  if (userCount === 0) {
    redirect("/setup");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    redirect("/register?error=email-exists");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
    },
    select: { id: true },
  });

  await login(formData);
}

export async function login(formData: FormData) {
  const email = normalizeEmail(readText(formData, "email"));
  const password = String(formData.get("password") ?? "");

  const userCount = await prisma.user.count();

  if (userCount === 0) {
    redirect("/setup");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function setupAdmin(formData: FormData) {
  const name = readText(formData, "name");
  const email = normalizeEmail(readText(formData, "email"));
  const password = readPassword(formData);

  if (!name || !email) {
    throw new Error("Nome e nome utente sono obbligatori.");
  }

  const userCount = await prisma.user.count();

  if (userCount > 0) {
    redirect("/login");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    redirect("/setup?error=email-exists");
  }

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "admin",
    },
    select: { id: true },
  });

  await createSession(admin.id);
  redirect("/");
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect("/settings?error=short");
  }

  if (newPassword !== confirmPassword) {
    redirect("/settings?error=mismatch");
  }

  const stored = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!stored || !verifyPassword(currentPassword, stored.passwordHash)) {
    redirect("/settings?error=wrong");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  redirect("/settings?changed=1");
}
