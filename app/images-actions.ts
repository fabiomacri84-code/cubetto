"use server";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "./auth";
import { prisma } from "./db";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function saveFile(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("L'immagine supera i 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Formato immagine non supportato.");
  }

  const name = `${crypto.randomBytes(16).toString("hex")}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await ensureUploadsDir();
  await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);

  return name;
}

export async function setItemImage(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("id") ?? "").trim();
  const file = formData.get("file");

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: true },
  });

  if (!item) {
    throw new Error("Elemento non trovato.");
  }

  if (item.list.ownerId !== user.id) {
    throw new Error("Non puoi modificare questa lista.");
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleziona un'immagine.");
  }

  const storedName = await saveFile(file);

  await prisma.item.update({
    where: { id: itemId },
    data: { imageUrl: `/api/files/${storedName}`, imageSource: "manual" },
  });

  revalidatePath(`/lists/${item.listId}`);
}

export async function clearItemImage(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("id") ?? "").trim();

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: true },
  });

  if (!item) {
    throw new Error("Elemento non trovato.");
  }

  if (item.list.ownerId !== user.id) {
    throw new Error("Non puoi modificare questa lista.");
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { imageUrl: null, imageSource: "emoji" },
  });

  revalidatePath(`/lists/${item.listId}`);
}

export async function setPackItemImage(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("id") ?? "").trim();
  const file = formData.get("file");

  const item = await prisma.packItem.findUnique({
    where: { id: itemId },
    include: { pack: true },
  });

  if (!item || item.pack.ownerId !== user.id) {
    throw new Error("Non puoi modificare questo pack.");
  }

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleziona un'immagine.");
  }

  const storedName = await saveFile(file);

  await prisma.packItem.update({
    where: { id: itemId },
    data: { imageUrl: `/api/files/${storedName}`, imageSource: "manual" },
  });

  revalidatePath(`/packs/${item.packId}`);
}

export async function clearPackItemImage(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("id") ?? "").trim();

  const item = await prisma.packItem.findUnique({
    where: { id: itemId },
    include: { pack: true },
  });

  if (!item || item.pack.ownerId !== user.id) {
    throw new Error("Non puoi modificare questo pack.");
  }

  await prisma.packItem.update({
    where: { id: itemId },
    data: { imageUrl: null, imageSource: "emoji" },
  });

  revalidatePath(`/packs/${item.packId}`);
}

export async function removeOrphanUpload(fileUrl: string) {
  const name = fileUrl.split("/").pop();

  if (!name) {
    return;
  }

  await fs.unlink(path.join(UPLOADS_DIR, name)).catch(() => {});
}