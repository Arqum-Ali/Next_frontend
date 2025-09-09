import { createClient } from "@supabase/supabase-js";

// Put your keys directly here
const supabaseUrl = "https://bcrbqogxkwceuevedagz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcmJxb2d4a3djZXVldmVkYWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNzAxNTksImV4cCI6MjA3Mjg0NjE1OX0.MwptwJGeBq66eNJSIaCN3vhPX_D75Zszl5Om3g0a8PY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
