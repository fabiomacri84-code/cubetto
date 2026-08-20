"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, hashPassword, normalizeEmail } from "./auth";
import { prisma } from "./db";

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();

  const userId = readText(formData, "userId");
  const role = readText(formData, "role");

  if (role !== "admin" && role !== "user") {
    throw new Error("Ruolo non valido.");
  }

  if (userId === admin.id && role !== "admin") {
    throw new Error("Non puoi toglierti il ruolo di amministratore.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!target) {
    throw new Error("Utente non trovato.");
  }

  if (target.role === "admin" && role !== "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });

    if (admins <= 1) {
      throw new Error("Deve esserci almeno un amministratore.");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/settings");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();

  const userId = readText(formData, "userId");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 8) {
    throw new Error("La nuova password deve avere almeno 8 caratteri.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!target) {
    throw new Error("Utente non trovato.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(newPassword) },
  });

  revalidatePath("/settings");
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();

  const userId = readText(formData, "userId");

  if (userId === admin.id) {
    throw new Error("Non puoi eliminare il tuo account.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!target) {
    throw new Error("Utente non trovato.");
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/settings");
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = readText(formData, "name");
  const email = normalizeEmail(readText(formData, "email"));
  const password = String(formData.get("password") ?? "");
  const role = readText(formData, "role");

  if (!name || !email) {
    throw new Error("Nome e nome utente sono obbligatori.");
  }

  if (password.length < 8) {
    throw new Error("La password deve avere almeno 8 caratteri.");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Esiste già un account con questo nome utente.");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: role === "admin" ? "admin" : "user",
    },
    select: { id: true },
  });

  revalidatePath("/settings");
}