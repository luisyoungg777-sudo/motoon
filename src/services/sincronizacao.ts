import { db } from '@/db/db'
import { obterSupabase } from './supabase'
import { sessaoAtual } from './auth'
import { agoraISO } from './datas'
import type { NomeTabela, RegistroBase } from '@/types'

/**
 * Sincronização bidirecional entre o Dexie e o Supabase.
 *
 * O Dexie continua sendo a fonte local. Isto aqui é backup: sobe o que está
 * na sync_queue e baixa o que mudou na nuvem desde a última visita.
 *
 * Regras que não se negociam:
 *  - conflito resolve por updated_at mais recente, dos dois lados;
 *  - nada é apagado de verdade — delete é deleted_at preenchido;
 *  - operação que falha CONTINUA na fila. Nunca sumimos com dado do usuário
 *    porque a rede caiu.
 */

const TABELAS: NomeTabela[] = [
  'motos',
  'itens_manutencao',
  'leituras_odometro',
  'servicos',
  'abastecimentos',
  'despesas',
]

const CHAVE_ULTIMA = 'sync.ultima'
const MAX_TENTATIVAS = 5

export type EstadoSync = 'ocioso' | 'sincronizando' | 'ok' | 'pendente' | 'erro'

export interface ResultadoSync {
  estado: EstadoSync
  enviados: number
  recebidos: number
  pendentes: number
  erro?: string
  em: string
}

let rodando = false

/**
 * A fila cresce uma linha por escrita, então salvar a mesma moto dez vezes
 * gera dez entradas. Só a última importa: o registro é enviado inteiro, não
 * como diff. Deduplicar evita subir dez vezes o mesmo dado.
 *
 * Função pura, separada do banco, porque é uma das duas regras aqui que
 * podem fazer o usuário perder informação.
 */
export function deduplicarFila<T extends { seq?: number; tabela: string; registro_id: string }>(
  bruta: T[],
): { itens: T[]; seqsObsoletas: number[] } {
  const porRegistro = new Map<string, T>()
  const seqsObsoletas: number[] = []

  for (const item of bruta) {
    const chave = `${item.tabela}:${item.registro_id}`
    const anterior = porRegistro.get(chave)
    if (anterior?.seq !== undefined) seqsObsoletas.push(anterior.seq)
    porRegistro.set(chave, item)
  }

  return { itens: Array.from(porRegistro.values()), seqsObsoletas }
}

/**
 * Quem vence num conflito. `updated_at` mais recente ganha; empate mantém o
 * local, que é o que a pessoa está vendo na tela. Registro que não existe
 * localmente sempre entra.
 */
export function devoAceitarRemoto(
  local: { updated_at: string } | undefined | null,
  remoto: { updated_at: string },
): boolean {
  if (!local) return true
  return local.updated_at < remoto.updated_at
}

function paraNuvem(registro: RegistroBase, user_id: string) {
  return { ...registro, user_id }
}

export async function sincronizar(): Promise<ResultadoSync> {
  const em = agoraISO()

  if (rodando) {
    return { estado: 'sincronizando', enviados: 0, recebidos: 0, pendentes: 0, em }
  }

  const sb = await obterSupabase()
  const conta = await sessaoAtual()

  if (!sb || !conta) {
    const pendentes = await db.sync_queue.count()
    return { estado: 'ocioso', enviados: 0, recebidos: 0, pendentes, em }
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const pendentes = await db.sync_queue.count()
    return { estado: 'pendente', enviados: 0, recebidos: 0, pendentes, em }
  }

  rodando = true
  let enviados = 0
  let recebidos = 0
  let erro: string | undefined

  try {
    // ------------------------------------------------------------- subir
    const { itens, seqsObsoletas } = deduplicarFila(await db.sync_queue.orderBy('seq').toArray())
    if (seqsObsoletas.length > 0) await db.sync_queue.bulkDelete(seqsObsoletas)

    for (const item of itens) {
      const registro = await db.table(item.tabela).get(item.registro_id)
      if (!registro) {
        // Some da fila: não há o que subir de um registro que não existe.
        if (item.seq !== undefined) await db.sync_queue.delete(item.seq)
        continue
      }

      const { error } = await sb
        .from(item.tabela)
        .upsert(paraNuvem(registro, conta.id), { onConflict: 'id' })

      if (error) {
        erro = error.message
        if (item.seq !== undefined) {
          const tentativas = item.tentativas + 1
          // Depois de muitas falhas, para de tentar a cada sync — mas
          // continua na fila, visível. Dado do usuário não se joga fora.
          await db.sync_queue.update(item.seq, { tentativas })
          if (tentativas < MAX_TENTATIVAS) break
        }
        continue
      }

      if (item.seq !== undefined) await db.sync_queue.delete(item.seq)
      enviados++
    }

    // ------------------------------------------------------------ baixar
    const desde = localStorage.getItem(CHAVE_ULTIMA) ?? '1970-01-01T00:00:00.000Z'

    for (const tabela of TABELAS) {
      const { data, error } = await sb
        .from(tabela)
        .select('*')
        .gt('updated_at', desde)
        .order('updated_at', { ascending: true })

      if (error) {
        erro = error.message
        continue
      }

      for (const remoto of data ?? []) {
        const { user_id: _ignorado, ...limpo } = remoto as Record<string, unknown> & {
          user_id?: string
        }
        const registro = limpo as unknown as RegistroBase
        const local = await db.table(tabela).get(registro.id)

        if (devoAceitarRemoto(local, registro)) {
          await db.table(tabela).put(registro)
          recebidos++
        }
      }
    }

    if (!erro) localStorage.setItem(CHAVE_ULTIMA, em)
  } catch (e) {
    erro = e instanceof Error ? e.message : 'falha inesperada'
  } finally {
    rodando = false
  }

  const pendentes = await db.sync_queue.count()

  return {
    estado: erro ? 'erro' : pendentes > 0 ? 'pendente' : 'ok',
    enviados,
    recebidos,
    pendentes,
    erro,
    em,
  }
}

export function ultimaSincronizacao(): string | null {
  return localStorage.getItem(CHAVE_ULTIMA)
}

export function esquecerSincronizacao(): void {
  localStorage.removeItem(CHAVE_ULTIMA)
}
