"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { requireUser } from "./auth";
import { prisma } from "./db";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readInt(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));

  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function readBool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

async function getUser() {
  return requireUser();
}

async function touchList(listId: string) {
  await prisma.list.update({
    where: { id: listId },
    data: { updatedAt: new Date() },
  });
}

/* ---------- Liste ---------- */

export async function createList(formData: FormData) {
  const user = await getUser();
  const name = readText(formData, "name");

  if (!name) {
    throw new Error("Il nome della lista è obbligatorio.");
  }

  const emoji = readText(formData, "emoji") || "🛒";
  const color = readText(formData, "color") || "#6d28d9";

  const list = await prisma.list.create({
    data: {
      name,
      emoji,
      color,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
    select: { id: true },
  });

  revalidatePath("/");
  redirect(`/lists/${list.id}`);
}

export async function updateListMeta(formData: FormData) {
  const user = await getUser();
  const id = readText(formData, "id");
  const list = await prisma.list.findUnique({ where: { id } });

  if (!list || list.ownerId !== user.id) {
    throw new Error("Non puoi modificare questa lista.");
  }

  await prisma.list.update({
    where: { id },
    data: {
      name: readText(formData, "name") || list.name,
      emoji: readText(formData, "emoji") || list.emoji,
      color: readText(formData, "color") || list.color,
    },
  });

  revalidatePath(`/lists/${id}`);
}

export async function deleteList(formData: FormData) {
  const user = await getUser();
  const id = readText(formData, "id");
  const list = await prisma.list.findUnique({ where: { id } });

  if (!list || list.ownerId !== user.id) {
    throw new Error("Non puoi eliminare questa lista.");
  }

  await prisma.list.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

/* ---------- Item ---------- */

export async function addItem(
  _prevState: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getUser();
  const listId = readText(formData, "listId");
  const name = readText(formData, "name");

  if (!name) {
    return { ok: false, error: "Il nome dell'elemento è obbligatorio." };
  }

  const membership = await prisma.listMember.findUnique({
    where: { listId_userId: { listId, userId: user.id } },
    select: { role: true },
  });

  if (!membership || membership.role === "viewer") {
    return { ok: false, error: "Non puoi modificare questa lista." };
  }

  const last = await prisma.item.findFirst({
    where: { listId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const categoryId = readText(formData, "categoryId") || null;

  await prisma.item.create({
    data: {
      listId,
      name,
      emoji: readText(formData, "emoji") || "📦",
      quantity: readInt(formData, "quantity", 1),
      checked: readBool(formData, "checked"),
      categoryId,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  await touchList(listId);
  revalidatePath(`/lists/${listId}`);
  return { ok: true };
}

export async function toggleItem(formData: FormData) {
  const user = await getUser();
  const itemId = readText(formData, "id");
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: { include: { members: true } } },
  });

  if (!item) {
    revalidatePath("/");
    return;
  }

  const member = item.list.members.find((m) => m.userId === user.id);

  if (!member || member.role === "viewer") {
    throw new Error("Non puoi modificare questa lista.");
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  });

  await touchList(item.listId);
  revalidatePath(`/lists/${item.listId}`);
}

export async function setItemQuantity(formData: FormData) {
  const user = await getUser();
  const itemId = readText(formData, "id");
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: { include: { members: true } } },
  });

  if (!item) {
    revalidatePath("/");
    return;
  }

  const member = item.list.members.find((m) => m.userId === user.id);

  if (!member || member.role === "viewer") {
    throw new Error("Non puoi modificare questa lista.");
  }

  const quantity = readInt(formData, "quantity", 1);

  await prisma.item.update({
    where: { id: itemId },
    data: { quantity: Math.min(quantity, 999) },
  });

  await touchList(item.listId);
  revalidatePath(`/lists/${item.listId}`);
}

export async function setItemEmoji(formData: FormData) {
  const user = await getUser();
  const itemId = readText(formData, "id");
  const emoji = readText(formData, "emoji") || "📦";
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: { include: { members: true } } },
  });

  if (!item) {
    revalidatePath("/");
    return;
  }

  const member = item.list.members.find((m) => m.userId === user.id);

  if (!member || member.role === "viewer") {
    throw new Error("Non puoi modificare questa lista.");
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { emoji, imageUrl: null, imageSource: "emoji" },
  });

  await touchList(item.listId);
  revalidatePath(`/lists/${item.listId}`);
}

export async function deleteItem(formData: FormData) {
  const user = await getUser();
  const itemId = readText(formData, "id");
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: { include: { members: true } } },
  });

  if (!item) {
    revalidatePath("/");
    return;
  }

  const member = item.list.members.find((m) => m.userId === user.id);

  if (!member || member.role === "viewer") {
    throw new Error("Non puoi modificare questa lista.");
  }

  await prisma.item.delete({ where: { id: itemId } });
  await touchList(item.listId);
  revalidatePath(`/lists/${item.listId}`);
}

export async function emptyList(formData: FormData) {
  const user = await getUser();
  const listId = readText(formData, "listId");

  const membership = await prisma.listMember.findUnique({
    where: { listId_userId: { listId, userId: user.id } },
    select: { role: true },
  });

  if (!membership || membership.role === "viewer") {
    throw new Error("Non puoi modificare questa lista.");
  }

  await prisma.item.updateMany({
    where: { listId, stored: false },
    data: { stored: true },
  });

  await touchList(listId);
  revalidatePath(`/lists/${listId}`);
}

export async function restoreItem(formData: FormData) {
  const user = await getUser();
  const itemId = readText(formData, "id");
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { list: { include: { members: true } } },
  });

  if (!item) {
    revalidatePath("/");
    return;
  }

  const member = item.list.members.find((m) => m.userId === user.id);

  if (!member || member.role === "viewer") {
    throw new Error("Non puoi modificare questa lista.");
  }

  await prisma.item.update({
    where: { id: itemId },
    data: { stored: false, checked: false },
  });

  await touchList(item.listId);
  revalidatePath(`/lists/${item.listId}`);
}

/* ---------- Pack ---------- */

export async function createPack(formData: FormData) {
  const user = await getUser();
  const name = readText(formData, "name");

  if (!name) {
    throw new Error("Il nome del pack è obbligatorio.");
  }

  const pack = await prisma.pack.create({
    data: {
      name,
      emoji: readText(formData, "emoji") || "🧳",
      color: readText(formData, "color") || "#6d28d9",
      ownerId: user.id,
    },
    select: { id: true },
  });

  revalidatePath("/");
  redirect(`/packs/${pack.id}`);
}

export async function updatePackMeta(formData: FormData) {
  const user = await getUser();
  const id = readText(formData, "id");
  const pack = await prisma.pack.findUnique({ where: { id } });

  if (!pack || pack.ownerId !== user.id) {
    throw new Error("Non puoi modificare questo pack.");
  }

  await prisma.pack.update({
    where: { id },
    data: {
      name: readText(formData, "name") || pack.name,
      emoji: readText(formData, "emoji") || pack.emoji,
      color: readText(formData, "color") || pack.color,
    },
  });

  revalidatePath(`/packs/${id}`);
}

export async function deletePack(formData: FormData) {
  const user = await getUser();
  const id = readText(formData, "id");
  const pack = await prisma.pack.findUnique({ where: { id } });

  if (!pack || pack.ownerId !== user.id) {
    throw new Error("Non puoi eliminare questo pack.");
  }

  await prisma.pack.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function addPackItem(formData: FormData) {
  const user = await getUser();
  const packId = readText(formData, "packId");
  const name = readText(formData, "name");

  if (!name) {
    throw new Error("Il nome dell'elemento è obbligatorio.");
  }

  const pack = await prisma.pack.findUnique({ where: { id: packId } });

  if (!pack || pack.ownerId !== user.id) {
    throw new Error("Non puoi modificare questo pack.");
  }

  const last = await prisma.packItem.findFirst({
    where: { packId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.packItem.create({
    data: {
      packId,
      name,
      emoji: readText(formData, "emoji") || "📦",
      quantity: readInt(formData, "quantity", 1),
      categoryId: readText(formData, "categoryId") || null,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath(`/packs/${packId}`);
}

export async function deletePackItem(formData: FormData) {
  const user = await getUser();
  const itemId = readText(formData, "id");
  const item = await prisma.packItem.findUnique({
    where: { id: itemId },
    include: { pack: true },
  });

  if (!item || item.pack.ownerId !== user.id) {
    throw new Error("Non puoi modificare questo pack.");
  }

  await prisma.packItem.delete({ where: { id: itemId } });
  revalidatePath(`/packs/${item.packId}`);
}

/* ---------- Inserimento pack in lista ---------- */

export async function insertPack(formData: FormData) {
  const user = await getUser();
  const listId = readText(formData, "listId");
  const packId = readText(formData, "packId");

  const membership = await prisma.listMember.findUnique({
    where: { listId_userId: { listId, userId: user.id } },
    select: { role: true },
  });

  if (!membership || membership.role === "viewer") {
    throw new Error("Non puoi modificare questa lista.");
  }

  const pack = await prisma.pack.findUnique({
    where: { id: packId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!pack) {
    throw new Error("Pack non trovato.");
  }

  const last = await prisma.item.findFirst({
    where: { listId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  let order = (last?.sortOrder ?? 0) + 1;

  await prisma.$transaction(
    pack.items.map((item) =>
      prisma.item.create({
        data: {
          listId,
          name: item.name,
          emoji: item.emoji,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          imageSource: item.imageSource,
          categoryId: item.categoryId,
          sortOrder: order++,
        },
      }),
    ),
  );

  await touchList(listId);
  revalidatePath(`/lists/${listId}`);
}

/* ---------- Inviti ---------- */

export async function generateInviteCode(formData: FormData) {
  const user = await getUser();
  const listId = readText(formData, "id");
  const list = await prisma.list.findUnique({ where: { id: listId } });

  if (!list || list.ownerId !== user.id) {
    throw new Error("Non puoi invitare a questa lista.");
  }

  const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  await prisma.list.update({
    where: { id: listId },
    data: { inviteCode },
  });

  revalidatePath(`/lists/${listId}`);
}

export async function clearInviteCode(formData: FormData) {
  const user = await getUser();
  const listId = readText(formData, "id");
  const list = await prisma.list.findUnique({ where: { id: listId } });

  if (!list || list.ownerId !== user.id) {
    throw new Error("Non puoi invitare a questa lista.");
  }

  await prisma.list.update({
    where: { id: listId },
    data: { inviteCode: null },
  });

  revalidatePath(`/lists/${listId}`);
}

export async function joinList(formData: FormData) {
  const user = await getUser();
  const inviteCode = readText(formData, "inviteCode").toUpperCase();

  const list = await prisma.list.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  if (!list) {
    throw new Error("Codice di invito non valido.");
  }

  await prisma.listMember.upsert({
    where: { listId_userId: { listId: list.id, userId: user.id } },
    update: {},
    create: { listId: list.id, userId: user.id, role: "editor" },
  });

  revalidatePath("/");
  redirect(`/lists/${list.id}`);
}

/* ---------- Membri ---------- */

export async function setMemberRole(formData: FormData) {
  const user = await getUser();
  const listId = readText(formData, "listId");
  const memberId = readText(formData, "memberId");
  const role = readText(formData, "role");

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { ownerId: true },
  });

  if (!list || list.ownerId !== user.id) {
    throw new Error("Solo il proprietario può gestire i membri.");
  }

  if (!["editor", "viewer"].includes(role)) {
    throw new Error("Ruolo non valido.");
  }

  const member = await prisma.listMember.findUnique({
    where: { id: memberId },
    select: { role: true },
  });

  if (!member) {
    throw new Error("Membro non trovato.");
  }

  if (member.role === "owner") {
    throw new Error("Non puoi cambiare ruolo al proprietario.");
  }

  await prisma.listMember.update({
    where: { id: memberId },
    data: { role: role as "editor" | "viewer" },
  });

  revalidatePath(`/lists/${listId}`);
}

export async function removeMember(formData: FormData) {
  const user = await getUser();
  const listId = readText(formData, "listId");
  const memberId = readText(formData, "memberId");

  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { ownerId: true },
  });

  if (!list || list.ownerId !== user.id) {
    throw new Error("Solo il proprietario può gestire i membri.");
  }

  const member = await prisma.listMember.findUnique({
    where: { id: memberId },
    select: { role: true },
  });

  if (!member || member.role === "owner") {
    throw new Error("Non puoi rimuovere il proprietario.");
  }

  await prisma.listMember.delete({ where: { id: memberId } });

  revalidatePath(`/lists/${listId}`);
}