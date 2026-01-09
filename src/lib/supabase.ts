import { createClient } from '@supabase/supabase-js';

// O Vite exige o prefixo VITE_ e o uso de import.meta.env para acessar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança para ajudar no debug caso as variáveis não sejam carregadas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Variáveis de ambiente do Supabase não foram encontradas. Verifique o arquivo .env ou as configurações na Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);