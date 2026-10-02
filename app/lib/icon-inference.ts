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

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const aliases: Record<string, string> = {
  pomodori: "🍅", carote: "🥕", patate: "🥔", cipolle: "🧅", peperoni: "🫑",
  zucchine: "🥒", melanzane: "🍆", magliette: "👕", giacche: "🧥",
  asciugamani: "🧺", spazzolini: "🪥", rasoi: "🪒", cavi: "🔌",
  caricatori: "🔌", passaporti: "📘", valigie: "🧳", zaini: "🎒",
  "burro di arachidi": "🥜", "carta di identita": "🪪", "carta di credito": "💳",
};
const keywords = Object.entries({ ...OBJECT_KEYWORDS, ...aliases })
  .map(([word, emoji]) => [normalize(word), emoji] as const)
  .sort((a, b) => b[0].length - a[0].length);

export function matchObjectIcon(name: string): string | null {
  const words = ` ${normalize(name)} `;
  return keywords.find(([word]) => words.includes(` ${word} `))?.[1] ?? null;
}

/** Local inference never transmits names to third parties. */
export async function inferIcon(name: string): Promise<string> {
  return matchObjectIcon(name) ?? "📦";
}
