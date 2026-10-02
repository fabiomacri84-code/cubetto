import "server-only";

// Names without a dedicated icon can still describe a known product/object.
// Public Wikidata labels/descriptions supply meaning; images are never requested.
const categories: Array<[RegExp, string]> = [
  [/\b(soft drinks?|carbonated beverages?|sodas?)\b/i, "soda"],
  [/\b(beverages?|drinks?)\b/i, "drink"],
  [/\b(soaps?|detergents?)\b/i, "soap"],
  [/\b(shampoos?|cosmetics?)\b/i, "lotion bottle"],
  [/\b(toothpastes?)\b/i, "toothbrush"],
  [/\b(footwear|shoes?|sneakers?)\b/i, "shoe"],
  [/\b(garments?|clothing|apparel)\b/i, "shirt"],
  [/\b(cheeses?)\b/i, "cheese"],
  [/\b(candies|confectionery|sweets?)\b/i, "candy"],
  [/\b(chocolates?)\b/i, "chocolate"],
  [/\b(biscuits?|cookies?)\b/i, "cookie"],
  [/\b(pastas?)\b/i, "pasta"],
  [/\b(vegetables?)\b/i, "vegetable"],
  [/\b(fruits?)\b/i, "fruit"],
];
const normalize = (value:string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();

type Entity = { label?: unknown; description?: unknown; match?: { text?: unknown } };
export async function relatedIconQueries(name: string, signal?: AbortSignal): Promise<string[]> {
  const key=normalize(name); if(!key || name.length>80) return [];
  const url=new URL("https://www.wikidata.org/w/api.php");
  for(const [field,value] of Object.entries({action:"wbsearchentities",search:name,language:"it",uselang:"en",limit:"6",format:"json"})) url.searchParams.set(field,value);
  try {
    const response=await fetch(url,{cache:"no-store",signal:signal ? AbortSignal.any([signal, AbortSignal.timeout(3000)]) : AbortSignal.timeout(3000),headers:{"User-Agent":"Cubetto (https://github.com/fabiomacri84-code/cubetto)"}});
    if(!response.ok) return [];
    const data=await response.json();
    const entities:Entity[]=Array.isArray(data.search)?data.search:[];
    // Do not turn prefix matches such as Fanta -> fantascienza into suggestions.
    const exact=entities.filter(entity => typeof entity.match?.text==="string" && normalize(entity.match.text)===key);
    const queries:string[]=[];
    for(const entity of exact) {
      const description=typeof entity.description==="string"?entity.description:"";
      if(/\b(surname|family name|given name|human|person|fictional character)\b/i.test(description)) continue;
      const category=categories.find(([pattern])=>pattern.test(description))?.[1];
      if(typeof entity.label==="string" && description && normalize(entity.label)!==key) queries.push(entity.label);
      if(category) queries.push(category);
    }
    return [...new Set(queries)].slice(0,2);
  } catch { return []; }
}
