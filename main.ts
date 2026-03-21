// main.ts

import { fetchFromMW, isBaseEntry, isMWEntry } from "./merriam-webster/mw.ts";
import { MWEntry } from "./merriam-webster/types.ts";
import {
  getEntriesByWord,
  getFromFetchedTerms,
  insertEntries,
  insertFetchedTerm,
} from "./supabase/db.ts";

Deno.serve(async (req) => {
  try {
    // 1. Parse and validate request
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    console.log("PART 1 Start");
    const body = await req.json().catch(() => null);
    const word = body?.word?.trim().toLowerCase();

    if (!word || typeof word !== "string") {
      return Response.json(
        { error: "Missing or invalid word" },
        { status: 400 },
      );
    }

    console.log("PART 1 End");
    // 2. Check fetched_terms cache
    console.log("PART 2 Start");
    const cached = await getFromFetchedTerms(word);

    if (cached) {
      if (!cached.exists) {
        // Word was looked up before and doesn't exist
        return Response.json(
          { error: `"${word}" was not found in the dictionary` },
          { status: 404 },
        );
      }

      // Word exists, fetch entries by headword
      const entries = await getEntriesByWord(cached.headword);
      return Response.json({ word: cached.headword, entries });
    }
    console.log("PART 2 End");

    // 3. Not in cache, fetch from MW
    console.log("PART 3 Start");
    const mwData = await fetchFromMW(word);

    // MW returns string[] when word not found (suggestions or empty)
    if (!mwData.length || !isMWEntry(mwData[0])) {
      await insertFetchedTerm(word, false, null);
      const suggestions = mwData.length
        ? { suggestions: mwData as string[] }
        : {};
      return Response.json(
        { error: `"${word}" was not found in the dictionary`, ...suggestions },
        { status: 404 },
      );
    }

    console.log("PART 3 End");

    // 4. Parse and insert entries
    console.log("PART 4 Start");
    const mwEntries = (mwData as MWEntry[]).filter(entry => isBaseEntry(entry, word))
    await insertEntries(mwEntries);

    // headword from first entry, strip syllable dots
    const headword = mwEntries[0].hwi.hw.replace(/\*/g, "");
    await insertFetchedTerm(word, true, headword);
    console.log("PART 4 End");

    // 5. Return entries by headword
    console.log("PART 5 Start");
    const entries = await getEntriesByWord(headword);
    return Response.json({ word: headword, entries });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
