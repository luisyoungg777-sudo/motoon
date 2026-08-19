import { hojeISO } from './datas'
import type { Lancamento } from './parser'
import type { TipoLancamento } from '@/types'

/** Um lançamento na bancada, esperando a confirmação do usuário. */
export interface Rascunho {
  chave: string
  lancamento: Lancamento
  /** false enquanto o km na tela for a estimativa automática. */
  kmConfirmado: boolean
}

let contador = 0

export function criarRascunho(lancamento: Lancamento, kmEstimado: number | null): Rascunho {
  contador += 1
  const precisaKm = lancamento.tipo === 'servico' || lancamento.tipo === 'abastecimento'
  const kmVazio = lancamento.km === null

  return {
    chave: `r${contador}`,
    kmConfirmado: !kmVazio,
    lancamento:
      kmVazio && precisaKm && kmEstimado !== null ? { ...lancamento, km: kmEstimado } : lancamento,
  }
}

export function rascunhoVazio(tipo: TipoLancamento, kmEstimado: number | null): Rascunho {
  return criarRascunho(
    {
      textoOriginal: '',
      tipo,
      data: hojeISO(),
      valor: null,
      km: null,
      litros: null,
      itemNome: null,
      categoriaDespesa: null,
      tipoCombustivel: tipo === 'abastecimento' ? 'gasolina' : null,
      tanqueCheio: tipo === 'abastecimento',
      descricao: '',
      confianca: 'alta',
      camposFaltando: [],
      numerosIgnorados: [],
    },
    kmEstimado,
  )
}
