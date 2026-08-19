import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { calcularVencimentos, estimarKm, type EstimativaKm, type Vencimento } from '@/services/calculos'
import { hojeISO } from '@/services/datas'
import type {
  Abastecimento,
  Despesa,
  ItemManutencao,
  LeituraOdometro,
  Moto,
  RegistroBase,
  Servico,
} from '@/types'

const CHAVE_MOTO_ATIVA = 'motoon.motoAtiva'

function vivos<T extends RegistroBase>(lista: T[] | undefined): T[] {
  return (lista ?? []).filter((r) => r.deleted_at === null)
}

export interface DadosMoto {
  moto: Moto | null
  motos: Moto[]
  trocarMoto: (id: string) => void
  carregando: boolean
  itens: ItemManutencao[]
  servicos: Servico[]
  abastecimentos: Abastecimento[]
  despesas: Despesa[]
  leituras: LeituraOdometro[]
  estimativa: EstimativaKm | null
  vencimentos: Vencimento[]
}

const Contexto = createContext<DadosMoto | null>(null)

export function ProvedorMoto({ children }: { children: ReactNode }) {
  const [motoId, setMotoId] = useState<string | null>(() => localStorage.getItem(CHAVE_MOTO_ATIVA))

  const motos = useLiveQuery(async () => {
    const lista = await db.motos.toArray()
    return lista.filter((m) => m.deleted_at === null && !m.arquivada)
  }, [])

  const moto = useMemo(() => {
    if (!motos) return null
    return motos.find((m) => m.id === motoId) ?? motos[0] ?? null
  }, [motos, motoId])

  useEffect(() => {
    if (moto && moto.id !== motoId) {
      setMotoId(moto.id)
      localStorage.setItem(CHAVE_MOTO_ATIVA, moto.id)
    }
  }, [moto, motoId])

  const trocarMoto = useCallback((id: string) => {
    setMotoId(id)
    localStorage.setItem(CHAVE_MOTO_ATIVA, id)
  }, [])

  const id = moto?.id ?? null

  const registros = useLiveQuery(async () => {
    if (!id) return null
    const [itens, servicos, abastecimentos, despesas, leituras] = await Promise.all([
      db.itens_manutencao.where('moto_id').equals(id).toArray(),
      db.servicos.where('moto_id').equals(id).toArray(),
      db.abastecimentos.where('moto_id').equals(id).toArray(),
      db.despesas.where('moto_id').equals(id).toArray(),
      db.leituras_odometro.where('moto_id').equals(id).toArray(),
    ])
    return { itens, servicos, abastecimentos, despesas, leituras }
  }, [id])

  const valor = useMemo<DadosMoto>(() => {
    // O IndexedDB devolve na ordem da chave primária, que é uuid — ou seja,
    // ordem aleatória na tela e no seletor de item. Ordena por nome.
    const itens = vivos(registros?.itens).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    const servicos = vivos(registros?.servicos)
    const abastecimentos = vivos(registros?.abastecimentos)
    const despesas = vivos(registros?.despesas)
    const leituras = vivos(registros?.leituras)

    const hoje = hojeISO()
    const estimativa = moto ? estimarKm(leituras, moto, hoje) : null
    const vencimentos = moto && estimativa ? calcularVencimentos(itens, servicos, moto, estimativa.km, hoje) : []

    return {
      moto,
      motos: motos ?? [],
      trocarMoto,
      carregando: motos === undefined,
      itens,
      servicos,
      abastecimentos,
      despesas,
      leituras,
      estimativa,
      vencimentos,
    }
  }, [moto, motos, registros, trocarMoto])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useMoto(): DadosMoto {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useMoto precisa estar dentro de <ProvedorMoto>')
  return ctx
}
