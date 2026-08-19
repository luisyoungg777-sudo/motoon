import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { sessaoAtual, aoMudarSessao, type Conta } from '@/services/auth'
import { supabaseConfigurado } from '@/services/supabase'
import { sincronizar, ultimaSincronizacao, type EstadoSync } from '@/services/sincronizacao'

export interface EstadoConta {
  /** null = ninguém logado. O app funciona igual. */
  conta: Conta | null
  /** false quando o .env não tem as chaves — nuvem simplesmente não existe. */
  configurado: boolean
  carregando: boolean
  /** Operações ainda esperando para subir. Vem da sync_queue de verdade. */
  pendentes: number
  sync: EstadoSync
  ultimaSync: string | null
  erroSync: string | null
  sincronizarAgora: () => Promise<void>
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

  const [sync, setSync] = useState<EstadoSync>('ocioso')
  const [ultimaSync, setUltimaSync] = useState<string | null>(() => ultimaSincronizacao())
  const [erroSync, setErroSync] = useState<string | null>(null)

  const sincronizarAgora = useCallback(async () => {
    setSync('sincronizando')
    const r = await sincronizar()
    setSync(r.estado)
    setErroSync(r.erro ?? null)
    if (r.estado === 'ok') setUltimaSync(ultimaSincronizacao())
  }, [])

  // Sincroniza ao entrar na conta e quando a internet volta. Sem conta,
  // nada acontece — nenhum dado sai do aparelho.
  useEffect(() => {
    if (!conta) {
      setSync('ocioso')
      return
    }

    void sincronizarAgora()

    const aoVoltar = () => void sincronizarAgora()
    window.addEventListener('online', aoVoltar)
    return () => window.removeEventListener('online', aoVoltar)
  }, [conta, sincronizarAgora])

  const valor = useMemo<EstadoConta>(
    () => ({
      conta,
      configurado,
      carregando,
      pendentes: pendentes ?? 0,
      sync,
      ultimaSync,
      erroSync,
      sincronizarAgora,
    }),
    [conta, configurado, carregando, pendentes, sync, ultimaSync, erroSync, sincronizarAgora],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useConta(): EstadoConta {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useConta precisa estar dentro de <ProvedorConta>')
  return ctx
}
