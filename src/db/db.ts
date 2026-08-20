import Dexie, { type Table } from 'dexie'
import type {
  Abastecimento,
  Despesa,
  ItemFilaSync,
  ItemManutencao,
  LeituraOdometro,
  Moto,
  Servico,
} from '@/types'

export interface Preferencia {
  chave: string
  valor: string
}

export class DiasdMotoDB extends Dexie {
  motos!: Table<Moto, string>
  leituras_odometro!: Table<LeituraOdometro, string>
  itens_manutencao!: Table<ItemManutencao, string>
  servicos!: Table<Servico, string>
  abastecimentos!: Table<Abastecimento, string>
  despesas!: Table<Despesa, string>
  sync_queue!: Table<ItemFilaSync, number>
  preferencias!: Table<Preferencia, string>

  constructor() {
    // NÃO renomeie para 'diasdmoto'. Este é o nome do banco no IndexedDB, e o
    // navegador identifica o banco por ele: trocar a string não renomeia
    // nada, abre um banco novo e vazio. Todo aparelho que já usa o app
    // perderia o histórico inteiro, em silêncio, no primeiro carregamento.
    // O app mudou de nome; o banco não precisa mudar junto — ninguém o vê.
    super('motoon')
    // Booleanos não podem virar índice no IndexedDB — 'arquivada', 'ativo' e
    // 'tanque_cheio' ficam de fora e são filtrados em memória.
    this.version(1).stores({
      motos: 'id, updated_at, criada_em',
      leituras_odometro: 'id, moto_id, data, [moto_id+data]',
      itens_manutencao: 'id, moto_id, categoria, nome, [moto_id+nome]',
      servicos: 'id, moto_id, item_id, data, [moto_id+data]',
      abastecimentos: 'id, moto_id, data, [moto_id+data]',
      despesas: 'id, moto_id, data, categoria, [moto_id+data]',
      sync_queue: '++seq, tabela, registro_id, criado_em',
      preferencias: 'chave',
    })
  }
}

export const db = new DiasdMotoDB()

export function novoId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  // Fallback para navegadores antigos / contexto não seguro.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16)
    const v = ch === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
