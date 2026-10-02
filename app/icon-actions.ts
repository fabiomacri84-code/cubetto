"use server";
import { requireUser } from "./auth";
import { matchObjectIcon } from "./lib/icon-inference";
import { findPlaceImage } from "./lib/online-images";
import type { IconSuggestion } from "./lib/icon-types";

export async function suggestIcon(name: string): Promise<IconSuggestion> {
  await requireUser();
  if (typeof name !== "string" || name.length > 80 || !name.trim()) return { emoji: "📦" };
  const emoji = matchObjectIcon(name);
  if (emoji) return { emoji };
  return await findPlaceImage(name) ?? { emoji: "📦" };
}
