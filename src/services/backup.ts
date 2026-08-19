import { db } from '@/db/db'
import { agoraISO } from './datas'
import type {
  Abastecimento,
  Despesa,
  ItemManutencao,
  LeituraOdometro,
  Moto,
  Servico,
} from '@/types'

export interface Backup {
  formato: 'motoon-backup'
  versao: 1
  gerado_em: string
  motos: Moto[]
  leituras_odometro: LeituraOdometro[]
  itens_manutencao: ItemManutencao[]
  servicos: Servico[]
  abastecimentos: Abastecimento[]
  despesas: Despesa[]
}

export async function exportarBackup(): Promise<Backup> {
  const [motos, leituras_odometro, itens_manutencao, servicos, abastecimentos, despesas] =
    await Promise.all([
      db.motos.toArray(),
      db.leituras_odometro.toArray(),
      db.itens_manutencao.toArray(),
      db.servicos.toArray(),
      db.abastecimentos.toArray(),
      db.despesas.toArray(),
    ])

  return {
    formato: 'motoon-backup',
    versao: 1,
    gerado_em: agoraISO(),
    motos,
    leituras_odometro,
    itens_manutencao,
    servicos,
    abastecimentos,
    despesas,
  }
}

export function baixarBackup(backup: Backup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `motoon-backup-${backup.gerado_em.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function ehBackup(v: unknown): v is Backup {
  return typeof v === 'object' && v !== null && (v as Backup).formato === 'motoon-backup'
}

/** Importa somando ao que já existe; em caso de id repetido, vence o updated_at mais novo. */
export async function importarBackup(texto: string): Promise<{ ok: boolean; erro?: string }> {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    return { ok: false, erro: 'Esse arquivo não é um backup do Motoon.' }
  }
  if (!ehBackup(dados)) return { ok: false, erro: 'Esse arquivo não é um backup do Motoon.' }

  const tabelas = [
    ['motos', dados.motos],
    ['leituras_odometro', dados.leituras_odometro],
    ['itens_manutencao', dados.itens_manutencao],
    ['servicos', dados.servicos],
    ['abastecimentos', dados.abastecimentos],
    ['despesas', dados.despesas],
  ] as const

  for (const [nome, registros] of tabelas) {
    for (const registro of registros ?? []) {
      const atual = await db.table(nome).get(registro.id)
      if (!atual || atual.updated_at < registro.updated_at) {
        await db.table(nome).put(registro)
      }
    }
  }

  return { ok: true }
}

export async function apagarTudo(): Promise<void> {
  await Promise.all([
    db.motos.clear(),
    db.leituras_odometro.clear(),
    db.itens_manutencao.clear(),
    db.servicos.clear(),
    db.abastecimentos.clear(),
    db.despesas.clear(),
    db.sync_queue.clear(),
    db.preferencias.clear(),
  ])
  localStorage.removeItem('motoon.motoAtiva')
}
