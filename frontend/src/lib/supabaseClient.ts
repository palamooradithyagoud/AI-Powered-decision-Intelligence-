import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ezigpxtfnkzdhekrlmkd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6aWdweHRmbmt6ZGhla3JsbWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODI2MjcsImV4cCI6MjEwMzE1ODYyN30.FFFFD00DXT-js8ZQ3W88MgV6yvTnBmi1owTwgH82gjA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
