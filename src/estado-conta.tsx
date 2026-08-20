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
import {
  esquecerSincronizacao,
  sincronizar,
  ultimaSincronizacao,
  type EstadoSync,
} from '@/services/sincronizacao'

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
  /** Esquece a marca d'água e baixa a nuvem inteira de novo. Não apaga nada daqui. */
  baixarTudoDeNovo: () => Promise<void>
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
  // A marca d'água é por conta, então só dá para lê-la depois de saber quem
  // entrou. Quem preenche é o efeito abaixo.
  const [ultimaSync, setUltimaSync] = useState<string | null>(null)
  const [erroSync, setErroSync] = useState<string | null>(null)

  const sincronizarAgora = useCallback(async () => {
    setSync('sincronizando')
    const r = await sincronizar()
    setSync(r.estado)
    setErroSync(r.erro ?? null)
    // 'ocioso' é sem conta e não carrega marca nenhuma; sobrescrever aí
    // apagaria da tela uma sincronização que de fato aconteceu.
    if (r.estado !== 'ocioso') setUltimaSync(r.ultima)
  }, [])

  const baixarTudoDeNovo = useCallback(async () => {
    if (!conta) return
    esquecerSincronizacao(conta.id)
    setUltimaSync(null)
    await sincronizarAgora()
  }, [conta, sincronizarAgora])

  // Sincroniza ao entrar na conta e quando a internet volta. Sem conta,
  // nada acontece — nenhum dado sai do aparelho.
  useEffect(() => {
    if (!conta) {
      setSync('ocioso')
      setUltimaSync(null)
      return
    }

    setUltimaSync(ultimaSincronizacao(conta.id))
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
      baixarTudoDeNovo,
    }),
    [
      conta,
      configurado,
      carregando,
      pendentes,
      sync,
      ultimaSync,
      erroSync,
      sincronizarAgora,
      baixarTudoDeNovo,
    ],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useConta(): EstadoConta {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useConta precisa estar dentro de <ProvedorConta>')
  return ctx
}
