// supabase/db.ts
import { MWEntry } from "../merriam-webster/types.ts";
import { supabase } from "./client.ts";

// Words table
export async function getFromFetchedTerms(term: string) {
  const { data } = await supabase
    .from("fetched_terms")
    .select("*")
    .eq("term", term)
    .maybeSingle();

  return data;
}

export async function insertFetchedTerm(
  term: string,
  exists: boolean,
  headword: string | null,
) {
  await supabase.from("fetched_terms").insert({
    term,
    exists,
    headword,
  });
}

export async function insertEntries(entries: MWEntry[]) {
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

export async function getEntriesByWord(word: string) {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("word", word)
    .order("homograph", { ascending: true, nullsFirst: true });

  if (error) throw new Error(`Query error: ${error.message}`);
  return data;
}

// User words
export async function addWordToCollection(
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
