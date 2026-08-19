import { iconPath, isIconAvailable } from "../lib/icon-db.generated";

export function IconImage({
  emoji,
  className,
  size,
}: {
  emoji: string;
  className?: string;
  size?: number;
}) {
  if (isIconAvailable(emoji)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconPath(emoji)}
        alt=""
        aria-hidden
        className={className}
        style={size ? { width: size, height: size } : undefined}
        loading="lazy"
      />
    );
  }
  return (
    <span aria-hidden className={className} style={size ? { fontSize: size } : undefined}>
      {emoji}
    </span>
  );
}