import { createClient } from "@supabase/supabase-js";

// Vite expõe apenas variáveis que começam com VITE_ (lidas do arquivo .env).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

// A chave anon/publishable é pública por design; quem protege os dados é o RLS (ver schema.sql).
export const supabase = createClient(url ?? "http://localhost", key ?? "missing-key");
