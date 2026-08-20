import { prisma } from "../app/db";
import { hashPassword } from "../app/auth";

const CATEGORIES = [
  { name: "Frutta e verdura", emoji: "🍎" },
  { name: "Latticini e uova", emoji: "🥛" },
  { name: "Pane e farinacei", emoji: "🍞" },
  { name: "Carne e pesce", emoji: "🍖" },
  { name: "Casa e pulizia", emoji: "🧽" },
  { name: "Abbigliamento", emoji: "👕" },
  { name: "Accessori e vari", emoji: "🎒" },
  { name: "Documenti", emoji: "🪪" },
  { name: "Elettronica", emoji: "🔌" },
  { name: "Altro", emoji: "📦" },
] as const;

const GROCERY_ITEMS: Array<
  [category: string, name: string, emoji: string, quantity?: number, checked?: boolean]
> = [
  ["Frutta e verdura", "Mele", "🍎", 4],
  ["Frutta e verdura", "Banane", "🍌", 2],
  ["Frutta e verdura", "Insalata", "🥬"],
  ["Latticini e uova", "Latte", "🥛", 2],
  ["Latticini e uova", "Uova", "🥚", 6],
  ["Latticini e uova", "Parmigiano", "🧀"],
  ["Pane e farinacei", "Pane integrale", "🍞"],
  ["Casa e pulizia", "Carta igienica", "🧻", 4],
  ["Casa e pulizia", "Detersivo panni", "🧴", undefined, true],
];

const SUITCASE_ITEMS: Array<
  [category: string, name: string, emoji: string, quantity?: number]
> = [
  ["Abbigliamento", "Magliette", "👕", 3],
  ["Abbigliamento", "Pantaloni", "👖", 2],
  ["Abbigliamento", "Boxer", "🩲", 4],
  ["Abbigliamento", "Calzini", "🧦", 4],
  ["Accessori e vari", "Kit bagno", "🧴"],
  ["Accessori e vari", "Spazzolino", "🪥"],
  ["Elettronica", "Caricatore", "🔌"],
  ["Accessori e vari", "Occhiali da sole", "🕶️"],
];

const PACKS: Record<
  string,
  Array<[category: string, name: string, emoji: string, quantity?: number]>
> = {
  "Valigia estate": [
    ["Abbigliamento", "Magliette", "👕", 4],
    ["Abbigliamento", "Canotte", "🎽", 3],
    ["Abbigliamento", "Pantaloncini", "🩳", 2],
    ["Abbigliamento", "Costume", "🩱"],
    ["Abbigliamento", "Calzini", "🧦", 4],
    ["Abbigliamento", "Boxer", "🩲", 5],
    ["Abbigliamento", "Infradito", "🩴"],
    ["Accessori e vari", "Kit bagno", "🧴"],
    ["Accessori e vari", "Asciugamano", "🏖️"],
    ["Accessori e vari", "Occhiali da sole", "🕶️"],
    ["Accessori e vari", "Creme solari", "🧴", 2],
    ["Elettronica", "Caricatore", "🔌"],
    ["Elettronica", "Powerbank", "🔋"],
  ],
  "Kit bagno": [
    ["Accessori e vari", "Spazzolino", "🪥"],
    ["Accessori e vari", "Dentifricio", "🦷"],
    ["Accessori e vari", "Deodorante", "🧴"],
    ["Accessori e vari", "Docciaschiuma", "🧼"],
    ["Accessori e vari", "Shampoo", "🧴"],
    ["Accessori e vari", "Pettine", "🪮"],
  ],
  "Spesa base": [
    ["Pane e farinacei", "Pasta", "🍝", 2],
    ["Frutta e verdura", "Pomodori", "🍅"],
    ["Accessori e vari", "Olio d'oliva", "🫒"],
    ["Accessori e vari", "Sale", "🧂"],
    ["Accessori e vari", "Caffè", "☕"],
    ["Latticini e uova", "Latte", "🥛"],
    ["Latticini e uova", "Uova", "🥚", 6],
    ["Pane e farinacei", "Pane", "🍞"],
  ],
};

const SEED_USERS = [
  { name: "Fabio", email: "fabio", password: "cubetto", role: "admin" },
  { name: "Carla", email: "carla", password: "cubetto", role: "user" },
] as const;

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "fabio" },
  });

  if (existing) {
    console.log("Seed già presente, salto.");
    return;
  }

  const categories: Record<string, { id: string }> = {};
  for (const [i, cat] of CATEGORIES.entries()) {
    const created = await prisma.category.create({
      data: { name: cat.name, emoji: cat.emoji, sortOrder: i },
    });
    categories[cat.name] = created;
  }

  for (const u of SEED_USERS) {
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: hashPassword(u.password),
        role: u.role,
      },
    });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "fabio" },
  });

  const createList = async (
    name: string,
    emoji: string,
    color: string,
    items: Array<[category: string, name: string, emoji: string, quantity?: number, checked?: boolean]>,
  ) => {
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
    });

    let order = 0;
    for (const [category, itemName, itemEmoji, quantity = 1, checked = false] of items) {
      await prisma.item.create({
        data: {
          listId: list.id,
          name: itemName,
          emoji: itemEmoji,
          quantity,
          checked,
          categoryId: categories[category]?.id,
          sortOrder: order++,
        },
      });
    }

    return list;
  };

  await createList("Spesa settimanale", "🛒", "#6d28d9", GROCERY_ITEMS);
  await createList("Valigia weekend", "🧳", "#b9801f", SUITCASE_ITEMS);

  for (const [packName, items] of Object.entries(PACKS)) {
    const pack = await prisma.pack.create({
      data: {
        name: packName,
        ownerId: user.id,
        emoji: packName === "Valigia estate" ? "🧳" : packName === "Kit bagno" ? "🧴" : "🛒",
      },
    });

    let order = 0;
    for (const [category, itemName, itemEmoji, quantity = 1] of items) {
      await prisma.packItem.create({
        data: {
          packId: pack.id,
          name: itemName,
          emoji: itemEmoji,
          quantity,
          categoryId: categories[category]?.id,
          sortOrder: order++,
        },
      });
    }
  }

  console.log(
    "Seed completato: utenti fabio / carla (password: cubetto), categorie, liste e pack creati.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
