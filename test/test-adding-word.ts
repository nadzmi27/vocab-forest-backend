// deno run --allow-net --allow-env --allow-write --env test/test-adding-word.ts

import { supabase } from "../supabase/client.ts";

const TEST_EMAIL = Deno.env.get("TEST_EMAIL")!;
const TEST_PASSWORD = Deno.env.get("TEST_PASSWORD")!;
const TEST_COLLECTION_ID = Deno.env.get("TEST_COLLECTION_ID")!;
const EDGE_FUNCTION_URL = Deno.env.get("EDGE_FUNCTION_URL") ?? "http://localhost:8000";
const WORD_TO_ADD = "well-being"
console.log("Sign in");

const { data, error: loginError } = await supabase.auth.signInWithPassword({
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
});

if (loginError || !data.session) {
  console.error("Sign in failed:", loginError?.message);
  Deno.exit(1);
}

const token = data.session.access_token

const body: Record<string, string> = { collectionId: TEST_COLLECTION_ID, word:WORD_TO_ADD };

const res = await fetch(EDGE_FUNCTION_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(body),
});

const json = await res.json();
console.log("Result Json:", json)
