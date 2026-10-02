const OBJECT_KEYWORDS: Record<string, string> = {
  latte: "🥛", uova: "🥚", pane: "🍞", burro: "🧈", formaggio: "🧀",
  yogurt: "🍶", frutta: "🍎", verdura: "🥕", carne: "🥩", pesce: "🐟",
  pasta: "🍝", riso: "🍚", olio: "🫒", sale: "🧂", zucchero: "🍬",
  caffè: "☕", acqua: "💧", succo: "🧃", birra: "🍺", vino: "🍷",
  cereali: "🌾", biscotti: "🍪", cioccolato: "🍫", gelato: "🍦",
  pizza: "🍕", hamburger: "🍔", pollo: "🍗", manzo: "🥩", maiale: "🐷",
  tonno: "🐟", salmone: "🐟", prosciutto: "🥩", salame: "🥩",
  parmigiano: "🧀", mozzarella: "🧀", ricotta: "🧀", panna: "🥛",
  pomodoro: "🍅", insalata: "🥬", carota: "🥕", patata: "🥔",
  cipolla: "🧅", aglio: "🧄", peperone: "🫑", zucchina: "🥒",
  melanzana: "🍆", finocchio: "🌿", sedano: "🌿", spinaci: "🌿",
  broccoli: "🥦", cavolfiore: "🥦", fagioli: "🫘", lenticchie: "🫘",
  ceci: "🫘", piselli: "🫛", mais: "🌽", patatine: "🍟", popcorn: "🍿",
  noci: "🥜", mandorle: "🥜", pistacchi: "🥜", miele: "🍯",
  marmellata: "🍯", nutella: "🍫", "burro arachidi": "🥜",
  shampoo: "🧴", bagnoschiuma: "🧴", sapone: "🧼", dentifricio: "🦷",
  spazzolino: "🪥", deodorante: "🧴", rasoio: "🪒", pettine: "🪮",
  asciugamano: "🧺", crema: "🧴", protettore: "☀️", collutorio: "💧",
  "filo interdentale": "🦷", cerotti: "🩹",
  antidolorifico: "💊", antinfiammatorio: "💊", disinfettante: "🧴",
  termometro: "🌡️", repellente: "🦟", farmaci: "💊",
  caricatore: "🔌", cavo: "🔌", powerbank: "🔋", auricolari: "🎧",
  cuffie: "🎧", adattatore: "🔌", mouse: "🖱️", tastiera: "⌨️",
  chiavetta: "💾", harddisk: "💾", ssd: "💾", router: "📶",
  tablet: "📱", ipad: "📱", kindle: "📖", smartwatch: "⌚",
  passaporto: "📘", "carta identità": "🪪", patente: "🪪",
  "tessera sanitaria": "🏥", "carta credito": "💳", contanti: "💶",
  assicurazione: "📄", prenotazioni: "📱",
  maglietta: "👕", pantaloni: "👖", calzini: "🧦", mutande: "🩲",
  felpa: "🧥", giacca: "🧥", scarpe: "👟", pigiama: "🩳",
  costume: "🩱", cintura: "🧣", cappello: "🧢", sciarpa: "🧣",
  guanti: "🧤", trolley: "🧳",
  beautycase: "💄", portafoglio: "👛", ombrello: "☔",
  impermeabile: "🧥", kway: "🧥", pile: "🧥", piumino: "🧥",
  spesa: "🛒", supermercato: "🛒", mercato: "🛒", negozio: "🏪",
  farmacia: "💊", ospedale: "🏥", medico: "👨‍⚕️", dentista: "🦷",
  scuola: "🏫", università: "🎓", lavoro: "💼", ufficio: "🏢",
  casa: "🏠", garage: "🚗", giardino: "🌳",
  viaggio: "✈️", vacanza: "🏖️", mare: "🌊", montagna: "⛰️",
  treno: "🚂", aereo: "✈️", nave: "🚢", autobus: "🚌",
  hotel: "🏨", campeggio: "⛺", tenda: "⛺", sacco: "🛌",
  zaino: "🎒", valigia: "🧳", borsa: "👜", beauty: "💄",
  documenti: "📄", soldi: "💶", biglietti: "🎫", voucher: "🎫",
  telefono: "📱", cellulare: "📱", computer: "💻", laptop: "💻",
  stampante: "🖨️", scanner: "📷", foto: "📷", video: "🎥",
  musica: "🎵", film: "🎬", serie: "📺", gioco: "🎮",
  sport: "⚽", calcio: "⚽", tennis: "🎾", basket: "🏀",
  nuoto: "🏊", palestra: "💪", corsa: "🏃", bici: "🚴",
  cane: "🐕", gatto: "🐈", animale: "🐾", veterinario: "👨‍⚕️",
  regalo: "🎁", compleanno: "🎂", natale: "🎄", pasqua: "🐣",
  festa: "🎉", matrimonio: "💍", anniversario: "💍",
};

async function geocodePlace(name: string): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1&accept-language=it`;
    const res = await fetch(url, { headers: { "User-Agent": "Cubetto/0.1" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;

    const place = data[0];
    const category = place.category?.toLowerCase() ?? "";
    const type = place.type?.toLowerCase() ?? "";

    if (category.includes("tourism") || type.includes("attraction")) return "🏛️";
    if (category.includes("historic")) return "🏛️";
    if (category.includes("natural")) return "🏞️";
    if (category.includes("leisure") || type.includes("park")) return "🌳";
    if (category.includes("shop") || type.includes("market")) return "🛒";
    if (category.includes("amenity") && (type.includes("restaurant") || type.includes("cafe") || type.includes("food"))) return "🍽️";
    if (category.includes("amenity") && type.includes("bar")) return "🍻";
    if (category.includes("amenity") && type.includes("pharmacy")) return "💊";
    if (category.includes("amenity") && type.includes("hospital")) return "🏥";
    if (category.includes("amenity") && type.includes("school")) return "🏫";
    if (category.includes("amenity") && type.includes("university")) return "🎓";
    if (category.includes("tourism") && type.includes("hotel")) return "🏨";
    if (category.includes("tourism") && type.includes("camp_site")) return "⛺";
    if (category.includes("transport") && type.includes("station")) return "🚂";
    if (category.includes("transport") && type.includes("airport")) return "✈️";
    if (category.includes("place") && (type.includes("city") || type.includes("town") || type.includes("village"))) return "🏙️";
    if (category.includes("place") && type.includes("country")) return "🌍";
    if (category.includes("place") && type.includes("island")) return "🏝️";
    if (category.includes("water") || type.includes("beach")) return "🏖️";
    if (category.includes("mountain") || type.includes("peak")) return "⛰️";

    return "📍";
  } catch {
    return null;
  }
}

function matchKeywords(name: string): string | null {
  const normalized = name.toLowerCase().trim();

  for (const [keyword, emoji] of Object.entries(OBJECT_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return emoji;
    }
  }
  return null;
}

export async function inferIcon(name: string): Promise<string> {
  if (!name || !name.trim()) return "📦";

  const keywordMatch = matchKeywords(name);
  if (keywordMatch) return keywordMatch;

  const placeIcon = await geocodePlace(name);
  if (placeIcon) return placeIcon;

  return "📦";
}
