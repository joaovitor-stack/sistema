import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Trocamos a ANON_KEY pela SERVICE_ROLE_KEY para ter acesso administrativo
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY faltando no .env");
  process.exit(1); 
}

// Inicializa o cliente com a chave mestra (Service Role)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});