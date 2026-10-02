"use server";
import { requireUser } from "./auth";
import { matchObjectIcon } from "./lib/icon-inference";
import { findImage } from "./lib/online-images";
import type { IconSuggestion } from "./lib/icon-types";

export async function suggestIcon(name: string): Promise<IconSuggestion> {
  await requireUser();
  if (typeof name !== "string" || name.length > 80 || !name.trim()) return { emoji: "📦" };
  const emoji = matchObjectIcon(name);
  const image = await findImage(name);
  return image ? { ...image, emoji: emoji ?? "📦" } : { emoji: emoji ?? "📦" };
}
