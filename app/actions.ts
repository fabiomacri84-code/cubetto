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

export type JoinResult = { ok: false; error: string } | undefined;

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

import { inferCategory } from "./lib/category-inference";

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

  let categoryId = readText(formData, "categoryId") || null;
  if (!categoryId) {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, emoji: true },
    });
    categoryId = inferCategory(name, categories);
  }

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

  const data: Record<string, unknown> = {
    name: readText(formData, "name") || pack.name,
    emoji: readText(formData, "emoji") || pack.emoji,
    color: readText(formData, "color") || pack.color,
  };

  const emoji = readText(formData, "emoji");
  if (emoji) {
    data.imageUrl = null;
    data.imageSource = "emoji";
  }

  await prisma.pack.update({
    where: { id },
    data,
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

export async function createDefaultPacks() {
  const user = await getUser();

  const defaultPacks = [
    {
      name: "Alimenti base",
      emoji: "🍎",
      color: "#ef4444",
      items: [
        { name: "Latte", emoji: "🥛", quantity: 1 },
        { name: "Uova", emoji: "🥚", quantity: 6 },
        { name: "Pane", emoji: "🍞", quantity: 1 },
        { name: "Burro", emoji: "🧈", quantity: 1 },
        { name: "Formaggio", emoji: "🧀", quantity: 1 },
        { name: "Yogurt", emoji: "🍶", quantity: 4 },
        { name: "Frutta", emoji: "🍎", quantity: 1 },
        { name: "Verdura", emoji: "🥕", quantity: 1 },
        { name: "Carne", emoji: "🥩", quantity: 1 },
        { name: "Pesce", emoji: "🐟", quantity: 1 },
        { name: "Pasta", emoji: "🍝", quantity: 1 },
        { name: "Riso", emoji: "🍚", quantity: 1 },
        { name: "Olio", emoji: "🫒", quantity: 1 },
        { name: "Sale", emoji: "🧂", quantity: 1 },
        { name: "Zucchero", emoji: "🍬", quantity: 1 },
        { name: "Caffè", emoji: "☕", quantity: 1 },
        { name: "Acqua", emoji: "💧", quantity: 6 },
      ],
    },
    {
      name: "Indumenti essenziali",
      emoji: "👕",
      color: "#3b82f6",
      items: [
        { name: "Magliette", emoji: "👕", quantity: 7 },
        { name: "Calzini", emoji: "🧦", quantity: 7 },
        { name: "Mutande", emoji: "🩲", quantity: 7 },
        { name: "Pantaloni", emoji: "👖", quantity: 3 },
        { name: "Felpe", emoji: "🧥", quantity: 2 },
        { name: "Giacca", emoji: "🧥", quantity: 1 },
        { name: "Scarpe", emoji: "👟", quantity: 2 },
        { name: "Pigiama", emoji: "🩳", quantity: 2 },
        { name: "Costume", emoji: "🩱", quantity: 1 },
        { name: "Cintura", emoji: "🧣", quantity: 1 },
        { name: "Cappello", emoji: "🧢", quantity: 1 },
        { name: "Sciarpa", emoji: "🧣", quantity: 1 },
        { name: "Guanti", emoji: "🧤", quantity: 1 },
      ],
    },
    {
      name: "Toilette e cura",
      emoji: "🪥",
      color: "#ec4899",
      items: [
        { name: "Spazzolino", emoji: "🪥", quantity: 1 },
        { name: "Dentifricio", emoji: "🦷", quantity: 1 },
        { name: "Shampoo", emoji: "🧴", quantity: 1 },
        { name: "Bagnoschiuma", emoji: "🧴", quantity: 1 },
        { name: "Deodorante", emoji: "🧴", quantity: 1 },
        { name: "Rasoio", emoji: "🪒", quantity: 1 },
        { name: "Pettine", emoji: "🪮", quantity: 1 },
        { name: "Asciugamano", emoji: "🧺", quantity: 2 },
        { name: "Creme viso", emoji: "🧴", quantity: 1 },
        { name: "Protettore solare", emoji: "☀️", quantity: 1 },
        { name: "Collutorio", emoji: "💧", quantity: 1 },
        { name: "Filo interdentale", emoji: "🦷", quantity: 1 },
      ],
    },
    {
      name: "Farmacia da viaggio",
      emoji: "💊",
      color: "#f59e0b",
      items: [
        { name: "Antidolorifico", emoji: "💊", quantity: 1 },
        { name: "Antinfiammatorio", emoji: "💊", quantity: 1 },
        { name: "Cerotti", emoji: "🩹", quantity: 10 },
        { name: "Disinfettante", emoji: "🧴", quantity: 1 },
        { name: "Antistaminico", emoji: "💊", quantity: 1 },
        { name: "Antiacido", emoji: "💊", quantity: 1 },
        { name: "Termometro", emoji: "🌡️", quantity: 1 },
        { name: "Repellente insetti", emoji: "🦟", quantity: 1 },
        { name: "Crema solare", emoji: "☀️", quantity: 1 },
        { name: "Farmaci personali", emoji: "💊", quantity: 1 },
      ],
    },
    {
      name: "Tech e cavi",
      emoji: "🔌",
      color: "#8b5cf6",
      items: [
        { name: "Caricatore telefono", emoji: "🔌", quantity: 1 },
        { name: "Power bank", emoji: "🔋", quantity: 1 },
        { name: "Cavo USB-C", emoji: "🔌", quantity: 1 },
        { name: "Cavo Lightning", emoji: "🔌", quantity: 1 },
        { name: "Auricolari", emoji: "🎧", quantity: 1 },
        { name: "Adattatore presa", emoji: "🔌", quantity: 1 },
        { name: "Caricatore laptop", emoji: "💻", quantity: 1 },
        { name: "Mouse", emoji: "🖱️", quantity: 1 },
        { name: "Chiavetta USB", emoji: "💾", quantity: 1 },
      ],
    },
    {
      name: "Documenti e soldi",
      emoji: "📄",
      color: "#22c55e",
      items: [
        { name: "Passaporto", emoji: "📘", quantity: 1 },
        { name: "Carta d'identità", emoji: "🪪", quantity: 1 },
        { name: "Patente", emoji: "🪪", quantity: 1 },
        { name: "Tessera sanitaria", emoji: "🏥", quantity: 1 },
        { name: "Carta di credito", emoji: "💳", quantity: 2 },
        { name: "Contanti", emoji: "💶", quantity: 1 },
        { name: "Assicurazione viaggio", emoji: "📄", quantity: 1 },
        { name: "Prenotazioni", emoji: "📱", quantity: 1 },
      ],
    },
  ];

  for (const packData of defaultPacks) {
    const existingPack = await prisma.pack.findFirst({
      where: {
        ownerId: user.id,
        name: packData.name,
      },
    });

    if (existingPack) {
      continue;
    }

await prisma.pack.create({
      data: {
        name: packData.name,
        emoji: packData.emoji,
        color: packData.color,
        ownerId: user.id,
        items: {
          create: packData.items.map((item, index) => ({
            name: item.name,
            emoji: item.emoji,
            quantity: item.quantity,
            sortOrder: index,
          })),
        },
      },
    });
  }

  revalidatePath("/");
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

  let categoryId = readText(formData, "categoryId") || null;
  if (!categoryId) {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, emoji: true },
    });
    categoryId = inferCategory(name, categories);
  }

  await prisma.packItem.create({
    data: {
      packId,
      name,
      emoji: readText(formData, "emoji") || "📦",
      quantity: readInt(formData, "quantity", 1),
      categoryId,
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

export async function joinList(formData: FormData): Promise<JoinResult> {
  const user = await getUser();
  const inviteCode = readText(formData, "inviteCode").toUpperCase();

  const list = await prisma.list.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  if (!list) {
    return { ok: false, error: "Codice di invito non valido." };
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