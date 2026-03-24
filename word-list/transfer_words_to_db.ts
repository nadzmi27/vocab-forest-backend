import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const logFile = await Deno.open("word-file/import.log", {
  create: true,
  append: true,
  write: true,
});
const encoder = new TextEncoder();

async function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  console.log(message);
  await logFile.write(encoder.encode(line));
}

const text = await Deno.readTextFile("word-list/common.txt");

const words = text
  .split("\n")
  .filter((line) => line.trim())
  .map((word) => ({ word: word.trim() }));

await log(`Starting import of ${words.length} words`);

const batchSize = 1000;
for (let i = 0; i < words.length; i += batchSize) {
  const batch = words.slice(i, i + batchSize);
  const { error } = await supabase.from("words").insert(batch);

  if (error) {
    await log(`Batch ${i} error: ${JSON.stringify(error)}`);
  } else {
    const inserted = Math.min(i + batchSize, words.length);
    await log(
      `Inserted ${inserted} / ${words.length} (${Math.round((inserted / words.length) * 100)}%)`,
    );
  }
}

await log("Import complete");
logFile.close();
