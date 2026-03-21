// merriam-webster/mw.ts
// Helper functions

import { MW_API_KEY } from "../config.ts";
import { MWEntry } from "./types.ts";


// Check if the entry is the base entry (e.g. bank:01, bank:02, controlled) and not compound form (e.g. bank card, controlled-experiment)
export function isBaseEntry(entry: MWEntry, searchTerm: string): boolean {
  const id = entry.meta.id.replace(/:\d+$/, "");
  const headword = entry.hwi.hw.replace(/\*/g, "");

  // always keep if it matches what was searched
  if (headword === searchTerm) return true;

  // skip compounds and phrases
  return !id.includes(" ") && !id.includes("-");
}

export function isMWEntry(item: unknown): item is MWEntry {
  return typeof item === "object" && item !== null && "meta" in item;
}

export async function fetchFromMW(word: string): Promise<MWEntry[] | string[]> {
  const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${MW_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`MW API error: ${res.status}`);
  }

  return res.json();
}


