"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  deleteSession,
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

  if (!email || !email.includes("@")) {
    throw new Error("Inserisci un'email valida.");
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
