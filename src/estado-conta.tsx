import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { sessaoAtual, aoMudarSessao, type Conta } from '@/services/auth'
import { supabaseConfigurado } from '@/services/supabase'

export interface EstadoConta {
  /** null = ninguém logado. O app funciona igual. */
  conta: Conta | null
  /** false quando o .env não tem as chaves — nuvem simplesmente não existe. */
  configurado: boolean
  carregando: boolean
  /** Operações ainda esperando para subir. Vem da sync_queue de verdade. */
  pendentes: number
}

const Contexto = createContext<EstadoConta | null>(null)

export function ProvedorConta({ children }: { children: ReactNode }) {
  const [conta, setConta] = useState<Conta | null>(null)
  const [carregando, setCarregando] = useState(supabaseConfigurado())
  const configurado = supabaseConfigurado()

  useEffect(() => {
    if (!configurado) return

    let vivo = true
    let cancelar: (() => void) | null = null

    sessaoAtual().then((c) => {
      if (!vivo) return
      setConta(c)
      setCarregando(false)
    })

    aoMudarSessao((c) => {
      if (vivo) setConta(c)
    }).then((fn) => {
      if (vivo) cancelar = fn
      else fn()
    })

    return () => {
      vivo = false
      cancelar?.()
    }
  }, [configurado])

  const pendentes = useLiveQuery(() => db.sync_queue.count(), [], 0)

  const valor = useMemo<EstadoConta>(
    () => ({ conta, configurado, carregando, pendentes: pendentes ?? 0 }),
    [conta, configurado, carregando, pendentes],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useConta(): EstadoConta {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useConta precisa estar dentro de <ProvedorConta>')
  return ctx
}
