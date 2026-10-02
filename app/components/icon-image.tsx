"use client";

import { useState } from "react";
import { iconPath, isIconAvailable } from "../lib/icon-db.generated";

export function IconImage({
  emoji,
  className,
  size,
  imageUrl,
}: {
  emoji: string;
  className?: string;
  size?: number;
  imageUrl?: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (imageUrl && failedUrl !== imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" aria-hidden className={className} style={size ? { width: size, height: size, objectFit: "cover" } : { objectFit: "cover" }} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(imageUrl)} />
    );
  }
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