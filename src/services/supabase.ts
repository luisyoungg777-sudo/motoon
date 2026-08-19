import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase carregado sob demanda.
 *
 * O SDK tem uns 40 kB gzip. Como login é opcional e boa parte do público do
 * Motoon nunca vai criar conta, ele só entra no bundle quando alguém abre a
 * tela de conta — mesmo tratamento dado ao jsPDF. O `import type` acima é
 * apagado na compilação, então não cria dependência estática.
 *
 * Sem VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env nada acontece:
 * `supabaseConfigurado()` devolve false e o app segue offline, inteiro.
 */

let cliente: SupabaseClient | null = null
let carregando: Promise<SupabaseClient | null> | null = null

function credenciais(): { url: string; chave: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  if (!url || !chave) return null
  return { url, chave }
}

export function supabaseConfigurado(): boolean {
  return credenciais() !== null
}

export async function obterSupabase(): Promise<SupabaseClient | null> {
  const cred = credenciais()
  if (!cred) return null
  if (cliente) return cliente

  if (!carregando) {
    carregando = import('@supabase/supabase-js')
      .then(({ createClient }) => {
        cliente = createClient(cred.url, cred.chave, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'motoon.sessao',
          },
        })
        return cliente
      })
      .catch(() => {
        carregando = null
        return null
      })
  }

  return carregando
}
