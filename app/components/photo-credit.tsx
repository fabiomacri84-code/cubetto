export function PhotoCredit({ attribution, sourceUrl, link = true }: { attribution?: string | null; sourceUrl?: string | null; link?: boolean }) {
  if (!attribution || !sourceUrl) return null;
  const text = `Foto: ${attribution}`;
  const style = "mt-1 block text-[10px] leading-snug text-text-3";
  return link ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={style + " underline"}>{text} · Wikimedia Commons</a> : <span className={style} title={sourceUrl}>{text} · Wikimedia Commons</span>;
}
