import { createClient } from "jsr:@supabase/supabase-js@2";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "../config.ts";

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
