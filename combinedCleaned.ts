// Config
const MW_API_KEY = Deno.env.get("MW_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Client
import { createClient } from "jsr:@supabase/supabase-js@2";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Merriam Webster -- Types
type MWResponse = MWEntry[] | string[];

interface MWEntry {
  // Always present
  meta: {
    id: string;
    uuid: string;
    sort: string;
    src: string;
    section: string;
    stems: string[];
    offensive: boolean;
  };
  hom?: number;
  hwi: {
    hw: string;
    prs?: MWPronunciation[];
  };
  fl?: string;
  shortdef: string[];

  // Optional

  ahws?: unknown;
  vrs?: unknown;
  lbs?: string[];
  sls?: string[];
  psl?: string;
  ins?: unknown[];
  cxs?: unknown[];
  def?: unknown[];
  uros?: unknown[];
  dros?: unknown[];
  dxnls?: unknown[];
  usages?: unknown[];
  syns?: unknown[];
  quotes?: unknown[];
  art?: unknown;
  table?: unknown;
  et?: unknown[];
  date?: string;
  [key: string]: unknown; // catch-all for anything else
}

interface MWPronunciation {
  mw: string;
  sound?: {
    audio: string;
    ref: string;
    stat: string;
  };
}

// Merriam Webster Helper Functions
// Check if the entry is the base entry (e.g. bank:01, bank:02, controlled) and not compound form (e.g. bank card, controlled-experiment)
function isBaseEntry(entry: MWEntry, searchTerm: string): boolean {
  const id = entry.meta.id.replace(/:\d+$/, "");
  const headword = entry.hwi.hw.replace(/\*/g, "");

  // always keep if it matches what was searched
  if (headword === searchTerm) return true;

  // skip compounds and phrases
  return !id.includes(" ") && !id.includes("-");
}

function isMWEntry(item: unknown): item is MWEntry {
  return typeof item === "object" && item !== null && "meta" in item;
}

async function fetchFromMW(word: string): Promise<MWEntry[] | string[]> {
  const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${MW_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`MW API error: ${res.status}`);
  }

  return res.json();
}

// Database function
// supabase/db.ts
async function getFromFetchedTerms(term: string) {
  const { error: getFetchError, data } = await supabase
    .from("fetched_terms")
    .select("*")
    .eq("term", term)
    .maybeSingle();

  if (getFetchError)
    throw new Error(`Get fetched word error: ${getFetchError.message}`);
  return data;
}

async function insertFetchedTerm(
  term: string,
  exists: boolean,
  headword: string | null,
) {
  const { error: insertFetchError } = await supabase
    .from("fetched_terms")
    .upsert({
      term,
      exists,
      headword,
    }, {onConflict: "term"});

  if (insertFetchError)
    throw new Error(`Insert fetched word error: ${insertFetchError.message}`);
}


async function insertEntries(entries: MWEntry[]) {
  const rows = entries.map((entry) => ({
    uuid: entry.meta.uuid,
    entry_id: entry.meta.id,
    word: entry.hwi.hw.replace(/\*/g, ""),
    homograph: entry.hom ?? null,
    pos: entry.fl ?? null,
    stems: entry.meta.stems ?? [],
    shortdef: entry.shortdef ?? [],
    raw: entry,
  }));

  // get unique words from entries
  const uniqueWords = [...new Set(rows.map((r) => r.word))].map((word) => ({
    word,
  }));

  // insert into words first (FK parent)
  const { error: wordsError } = await supabase
    .from("words")
    .upsert(uniqueWords, { onConflict: "word" });

  if (wordsError) throw new Error(`Words insert error: ${wordsError.message}`);

  // then insert entries
  const { error: entriesError } = await supabase
    .from("entries")
    .upsert(rows, { onConflict: "entry_id" });

  if (entriesError) throw new Error(`Insert error: ${entriesError.message}`);
}

async function getEntriesByWord(word: string) {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("word", word)
    .order("homograph", { ascending: true, nullsFirst: true });

  if (error) throw new Error(`Query error: ${error.message}`);
  return data;
}

async function addWordToCollection(
  userId: string,
  collectionId: string,
  word: string,
) {
  const { data: userWord, error: userWordError } = await supabase
    .from("user_words")
    .upsert({ user_id: userId, word: word }, { onConflict: "user_id,word" })
    .select("id")
    .single();

  if (userWordError)
    throw new Error(`user_words error: ${userWordError.message}`);

  const { error: collectionWordError } = await supabase
    .from("collection_words")
    .upsert(
      { collection_id: collectionId, user_word_id: userWord.id },
      { onConflict: "collection_id,user_word_id" },
    );

  if (collectionWordError)
    throw new Error(`collection_words error: ${collectionWordError.message}`);
}


// main.ts
Deno.serve(async (req) => {
  try {
    // 1. Parse and validate request
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const word = body?.word?.trim().toLowerCase();
    const userId = user.id
    const collectionId = body?.collectionId;

    if (!collectionId || typeof collectionId !== "string") {
      return Response.json({ error: "Missing collectionId" }, { status: 400 });
    }

    if (!word || typeof word !== "string") {
      return Response.json(
        { error: "Missing or invalid word" },
        { status: 400 },
      );
    }

    // 2. Check fetched_terms cache
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
      await addWordToCollection(userId, collectionId, cached.headword);
      return Response.json({ word: cached.headword, entries });
    }

    // 3. Not in cache, fetch from MW
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


    // 4. Parse and insert entries
    const mwEntries = (mwData as MWEntry[]).filter((entry) =>
      isBaseEntry(entry, word),
    );

    if (mwEntries.length === 0) {
      await insertFetchedTerm(word, false, null);
      return Response.json(
        { error: `No valid base entries found for "${word}"` },
        { status: 404 },
      );
    }

    await insertEntries(mwEntries);
    
    // headword from first entry, strip syllable dots
    const headword = mwEntries[0].hwi.hw.replace(/\*/g, "");
    await insertFetchedTerm(word, true, headword);

    // 5. Add the word to user's collection
    await addWordToCollection(userId, collectionId, headword);

    // 6. Return entries by headword
    const entries = await getEntriesByWord(headword);
    return Response.json({ word: headword, entries });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
});
