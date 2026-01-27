// src/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gwucfwsjzowplfxnayis.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_yHMtOsxYhOd-jF6NcVj_Eg_NEbPHb_5";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
