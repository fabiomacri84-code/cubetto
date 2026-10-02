export function PhotoCredit({ attribution, sourceUrl, link = true }: { attribution?: string | null; sourceUrl?: string | null; link?: boolean }) {
  if (!attribution || !sourceUrl) return null;
  const isIcon = sourceUrl.startsWith("https://icon-sets.iconify.design/");
  const provider = isIcon ? "Iconify" : "Wikimedia Commons";
  const text = `${isIcon ? "Icona" : "Foto"}: ${attribution}`;
  const style = "mt-1 block text-[10px] leading-snug text-text-3";
  return link ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={style + " underline"}>{text} · {provider}</a> : <span className={style} title={sourceUrl}>{text} · {provider}</span>;
}
