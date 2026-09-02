import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // Aparece no console do navegador se as variáveis de ambiente não foram definidas.
  console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (arquivo .env ou variáveis na Vercel).')
}

export const supabase = createClient(url, key)
