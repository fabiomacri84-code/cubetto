import "server-only";
import type { IconSuggestion } from "./icon-types";
import catalog from "../../public/icons.json";
import { matchObjectIcon } from "./icon-inference";
import { relatedIconQueries } from "./icon-search-terms";

// Only icon collections with explicit free licenses, never stock/photo searches.
const sets: Record<string, { author: string; license: string }> = {
  "fluent-emoji-flat": { author: "Microsoft", license: "MIT" },
  "lucide": { author: "Lucide Contributors", license: "ISC" },
  "simple-icons": { author: "Simple Icons Collaborators", license: "CC0-1.0" },
};
const translations: Record<string,string> = { occhiali: "glasses", "occhiali da sole": "sunglasses", infradito: "thong sandal", tagliaunghie: "nail clipper", cacciavite: "screwdriver", pinza: "pliers", borraccia: "water bottle", aspirapolvere: "vacuum", caricabatterie: "charger", chiave: "key", casco: "helmet", candela: "candle", scotch: "tape", detersivo: "detergent", spugna: "sponge", forbici: "scissors", irlanda: "ireland" };
// Catalog searches use English names. Reuse local inference for aliases/plurals
// (e.g. shampoo -> Lozione) and match whole phrases before shorter keywords.
const catalogTranslations: Record<string,string> = Object.fromEntries(`
Carrello spesa=shopping cart;Mela=apple;Banana=banana;Uva=grapes;Fragola=strawberry;Limone=lemon;Arancia=orange;Pera=pear;Pesca=peach;Ciliegie=cherries;Anguria=watermelon;Ananas=pineapple;Kiwi=kiwi fruit;Cocco=coconut;Mango=mango;Pomodoro=tomato;Carota=carrot;Patata=potato;Broccoli=broccoli;Insalata=leafy green;Cetriolo=cucumber;Cipolla=onion;Aglio=garlic;Peperone=bell pepper;Mais=corn;Funghi=mushroom;Avocado=avocado;Olive=olive;Pane=bread;Baguette=baguette bread;Croissant=croissant;Bretzel=pretzel;Bagel=bagel;Waffle=waffle;Pancake=pancakes;Formaggio=cheese;Uova=egg;Uovo al tegamino=cooking;Bacon=bacon;Bistecca=cut of meat;Coscia di pollo=poultry leg;Osso con carne=meat on bone;Ravioli=dumpling;Pizza=pizza;Hamburger=hamburger;Patatine fritte=french fries;Hot dog=hot dog;Panino=sandwich;Spaghetti=spaghetti;Ramen=steaming bowl;Stufato=pot of food;Paella=shallow pan of food;Insalatona=green salad;Riso al curry=curry rice;Riso=rice;Scatoletta=canned food;Popcorn=popcorn;Sale=salt;Peperoncino=hot pepper;Caramelle=candy;Cioccolato=chocolate bar;Biscotti=cookie;Ciambella=doughnut;Torta=cake;Cupcake=cupcake;Lecca lecca=lollipop;Gelato=ice cream;Ghiaccio=ice;Caffè=hot beverage;Tè=teacup;Latte=glass of milk;Succo in brick=beverage box;Bubble tea=bubble tea;Bibita=cup with straw;Cocktail=cocktail glass;Birra=beer;Vino=wine;Spumante=bottle with popping cork;Acqua=droplet;
Scopa=broom;Cesto=basket;Spugna=sponge;Sapone=soap;Secchio=bucket;Cestino=wastebasket;Carta igienica=roll of paper;Spilla da balia=safety pin;Candela=candle;Lozione=lotion bottle;Spazzolino=toothbrush;Dente=tooth;Doccia=shower;Vasca da bagno=bathtub;Rasoio=razor;Parrucchiere=barber pole;Sauna=sauna;Unghie=nail polish;Rossetto=lipstick;Labbra=mouth;
Maglietta=t shirt;Pantaloni=jeans;Slip=briefs;Costume intero=one piece swimsuit;Boxer=shorts;Infradito=thong sandal;Calzini=socks;Canottiera=running shirt;Scarpe da ginnastica=running shoe;Scarpe eleganti=shoe;Tacco alto=high heeled shoe;Ballerine=flat shoe;Vestito=dress;Kimono=kimono;Cappotto=coat;Sciarpa=scarf;Guanti=gloves;Cappellino=billed cap;Cappello=top hat;Cappello estivo=woman hat;Occhiali da sole=sunglasses;Occhiali=glasses;Borsa=handbag;Portamonete=purse;Anello=ring;
Spina=electric plug;Batteria=battery;Telefono=mobile phone;Cuffie=headphone;Fotocamera=camera;Computer=laptop;Orologio smart=watch;Stampante=printer;Mouse=computer mouse;Tastiera=keyboard;Televisore=television;Cassa=speaker;Videogiochi=video game;Videocamera=video camera;Torcia=flashlight;Lampadina=light bulb;Joystick=joystick;Monitor=desktop computer;Radio=radio;
Documento=page;Note=memo;Matita=pencil;Penna=pen;Appunti=clipboard;Cartella=file folder;Cartella aperta=open file folder;Schedario=card index;Graffetta=paperclip;Graffette=linked paperclips;Puntina=pushpin;Forbici=scissors;Archivio=card file box;Documento d'identità=identification card;Moneta=coin;Euro=euro banknote;Dollari=dollar banknote;Carta di credito=credit card;Scontrino=receipt;Pacco=package;Cassetta postale=mailbox;Lettera=envelope;Valigia=luggage;Zaino=backpack;Buste della spesa=shopping bags;
Spiaggia=beach;Palma=palm tree;Mappa=map;Aereo=airplane;Automobile=automobile;Autobus=bus;Treno=train;Bicicletta=bicycle;Scooter=motor scooter;Benzinaio=fuel pump;Campeggio=camping;Tenda=tent;Bussola=compass;Pillole=pill;Siringa=syringe;Cerotto=adhesive bandage;Stetoscopio=stethoscope;Termometro=thermometer;Provetta=test tube;Virus=microbe;Coltura batterica=petri dish;Ospedale=hospital;
Cane=dog;Gatto=cat;Coniglio=rabbit;Criceto=hamster;Tartaruga=turtle;Pesce=fish;Uccello=bird;Pappagallo=parrot;Ape=bee;Coccinella=lady beetle;Farfalla=butterfly;Germoglio=seedling;Erba=herb;Fiore=blossom;Girasole=sunflower;Rosa=rose;Pianta in vaso=potted plant;Orsacchiotto=teddy bear;Regalo=gift;Palloncino=balloon;Fiocco=ribbon;Gomitolo=yarn;Filo=thread;Ago=sewing needle;Chiavi=key;Lucchetto=lock;Orologio=clock;Sveglia=alarm clock;Nota musicale=musical note;Palette=artist palette;Calamita=magnet;Scala=ladder;Estintore=fire extinguisher
`.trim().split(";").map(entry => entry.trim().split("=")));
function normalizeName(name:string):string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
const translatedKeywords = Object.entries(translations).sort((a,b)=>b[0].length-a[0].length);
function searchQuery(name:string):string {
  const words = ` ${name} `;
  const translated = translatedKeywords.find(([word])=>words.includes(` ${normalizeName(word)} `))?.[1];
  if(translated) return translated;
  const emoji=matchObjectIcon(name);
  const local=emoji ? catalog.find(icon=>icon.emoji===emoji) : null;
  return (local && catalogTranslations[local.name]) || name;
}
const cache = new Map<string,{until:number;value:IconSuggestion[]}>();
const pending = new Map<string,Promise<IconSuggestion[]>>();
const validated = new Map<string,{until:number;value:IconSuggestion}>();
const freeLicenses = new Set(["MIT", "ISC", "Apache-2.0", "CC0-1.0", "CC-BY-3.0", "CC-BY-4.0"]);
let collectionsUntil = 0;
let collectionsRequest: Promise<void> | undefined;
function identity(title: string) {
  const match = /^Iconify:([a-z0-9-]+):([a-z0-9-]+)$/.exec(title);
  return match ? { prefix:match[1],name:match[2] } : null;
}
async function api(url: URL, signal?: AbortSignal) {
  const response = await fetch(url, { cache:"no-store", signal:signal ? AbortSignal.any([signal, AbortSignal.timeout(4000)]) : AbortSignal.timeout(4000) });
  if(!response.ok) throw new Error("Catalogo icone non disponibile.");
  return response.json();
}
async function loadCollections(signal?: AbortSignal) {
  if (collectionsUntil > Date.now()) return;
  if (!collectionsRequest) {
    collectionsRequest = (async () => {
      try {
        const data = await api(new URL("https://api.iconify.design/collections"), signal);
        if (!data || typeof data !== "object" || Array.isArray(data)) return;
        for (const [prefix, info] of Object.entries(data)) {
          if (!/^[a-z0-9-]+$/.test(prefix) || !info || typeof info !== "object") continue;
          const metadata = info as { author?: { name?: unknown }; license?: { spdx?: unknown } };
          const author = metadata.author?.name;
          const license = metadata.license?.spdx;
          if (typeof author === "string" && author.trim() && typeof license === "string" && freeLicenses.has(license)) {
            sets[prefix] = { author, license };
          }
        }
        collectionsUntil = Date.now() + 3600000;
      } catch {
        // Keep the established free catalogs usable during a metadata outage.
        collectionsUntil = Date.now() + 10000;
      }
    })().finally(() => { collectionsRequest = undefined; });
  }
  await collectionsRequest;
}
export async function resolveOnlineIcon(title:string, signal?:AbortSignal):Promise<IconSuggestion|null> {
  const id=identity(title); if(!id) return null;
  const previous=validated.get(title); if(previous && previous.until>Date.now()) return previous.value;
  try {
    if (!sets[id.prefix]) await loadCollections(signal);
    const metadata=sets[id.prefix];
    if (!metadata) return null;
    const url=new URL(`https://api.iconify.design/${id.prefix}.json`);url.searchParams.set("icons",id.name);
    const data=await api(url,signal);
    if(!data.icons?.[id.name] || typeof data.icons[id.name].body!=="string") return null;
    const value={emoji:"📦",photoTitle:title,imageUrl:`https://api.iconify.design/${id.prefix}/${id.name}.svg`,attribution:`${metadata.author} · ${metadata.license}`,sourceUrl:`https://icon-sets.iconify.design/${id.prefix}/${id.name}/`};
    if(validated.size>=256) validated.delete(validated.keys().next().value!);
    validated.set(title,{until:Date.now()+3600000,value});return value;
  } catch { return null; }
}
function relevantIdentity(id: string, query: string) {
  const parsed = identity(`Iconify:${id}`);
  if (!parsed) return false;
  const words = ` ${normalizeName(parsed.name)} `;
  return normalizeName(query).split(" ").every(word => words.includes(` ${word} `));
}
async function searchIcons(query: string, signal: AbortSignal): Promise<IconSuggestion[]> {
  const url=new URL("https://api.iconify.design/search");
  url.searchParams.set("query",query);url.searchParams.set("limit","64");
  const data=await api(url,signal);
  await loadCollections(signal);
  const titles: string[] = Array.isArray(data.icons) ? [...new Set<string>(data.icons.filter((id:unknown):id is string=>typeof id==="string" && relevantIdentity(id,query)))].filter(id => !!sets[identity(`Iconify:${id}`)!.prefix]) : [];
  titles.sort((a,b) => Number(identity(`Iconify:${b}`)!.name === query.replaceAll(" ","-")) - Number(identity(`Iconify:${a}`)!.name === query.replaceAll(" ","-")));
  const result:IconSuggestion[]=[];
  for(const id of titles.slice(0,8)) { const icon=await resolveOnlineIcon(`Iconify:${id}`,signal);if(icon) result.push(icon);if(result.length===2 || signal.aborted) break; }
  return result;
}
export async function findOnlineIcons(name:string):Promise<IconSuggestion[]> {
  if(name.trim().length>80) return [];
  const key=normalizeName(name); if(!key) return [];
  const existing=cache.get(key); if(existing && existing.until>Date.now()) return existing.value;
  if(pending.has(key)) return pending.get(key)!;
  if(pending.size>=10) return [];
  const work=(async()=>{
    const signal=AbortSignal.timeout(12000);
    // Hidden logos may be absent from search; derive every brand identity uniformly.
    const brand = await resolveOnlineIcon(`Iconify:simple-icons:${key.replaceAll(" ", "")}`, signal);
    let result = brand ? [brand] : await searchIcons(searchQuery(key), signal);
    if (!result.length && !signal.aborted) {
      const related = await relatedIconQueries(key, signal);
      for (const query of related) {
        if (signal.aborted) break;
        result = (await searchIcons(query, signal)).map(icon => ({ ...icon, suggestionNote: "Icona correlata al prodotto" }));
        if (result.length) break;
      }
    }
    if(cache.size>=256) cache.delete(cache.keys().next().value!);
    cache.set(key,{until:Date.now()+(result.length?3600000:10000),value:result});return result;
  })().finally(()=>pending.delete(key));
  pending.set(key,work);return work;
}
