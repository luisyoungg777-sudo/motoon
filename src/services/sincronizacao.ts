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

/**
 * São duas datas diferentes, e confundir as duas custa dado:
 *
 *  - `updated_at` é o relógio de QUEM ESCREVEU. É o que resolve conflito,
 *    porque "qual das duas versões é a mais nova" só faz sentido no tempo de
 *    quem editou.
 *  - `synced_at` é o carimbo do SERVIDOR na hora em que a linha chegou. É o
 *    que move a marca d'água, porque "o que eu ainda não vi" só faz sentido
 *    num relógio só, o mesmo para todos os aparelhos.
 *
 * A primeira versão usava `updated_at` para as duas coisas, comparando o
 * relógio de quem lê com o relógio de quem escreve. Isso escondia de um
 * aparelho todo registro que o outro tivesse feito offline antes da última
 * sincronização dele: o celular anota às 09:30 sem sinal, sobe às 11:00, e o
 * PC — que sincronizou às 10:00 — pergunta "o que mudou depois das 10:00" e
 * nunca mais enxerga aquele registro. Num app que se propõe a funcionar
 * offline, esse era o caminho principal, não a borda.
 */
const PREFIXO_ULTIMA = 'sync.ultima'

/**
 * A marca d'água é por conta. Sem isso, entrar com outra conta no mesmo
 * aparelho herdava a marca da anterior, e o histórico antigo da conta nova
 * nunca descia.
 */
function chaveUltima(userId: string): string {
  return `${PREFIXO_ULTIMA}:${userId}`
}

/**
 * A chave antiga guardava relógio local medido contra `updated_at`. Em termos
 * de `synced_at` esse número não quer dizer nada, então ela não é migrada: é
 * descartada, e o aparelho baixa a nuvem inteira uma vez. Baixar de novo não
 * custa nada — o desempate por updated_at mantém o que já está aqui.
 */
function descartarChaveAntiga(): void {
  try {
    localStorage.removeItem(PREFIXO_ULTIMA)
  } catch {
    // localStorage indisponível (aba privada, cota cheia): seguir sem isso.
  }
}

const INICIO_DOS_TEMPOS = '1970-01-01T00:00:00.000Z'
const MAX_TENTATIVAS = 5

export type EstadoSync = 'ocioso' | 'sincronizando' | 'ok' | 'pendente' | 'erro'

export interface ResultadoSync {
  estado: EstadoSync
  enviados: number
  recebidos: number
  pendentes: number
  erro?: string
  em: string
  /** Marca d'água depois desta rodada. Vem do servidor, não do relógio daqui. */
  ultima: string | null
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
 * Os dois lados escrevem o mesmo instante em formatos diferentes: o navegador
 * manda `2026-08-20T14:03:11.123Z` e o Postgres devolve
 * `2026-08-20T14:03:11.123456+00:00`, às vezes sem os zeros do fim.
 *
 * Comparar essas duas strings como texto dá o resultado certo — conferido em
 * 300 mil pares aleatórios, zero divergência. Mas dá certo por acidente: na
 * tabela ASCII o `+` e o `.` caem abaixo dos dígitos e o `Z` cai acima, e é
 * isso, e não a semântica de data, que faz a ordem bater. O dia em que o
 * Postgres devolver um fuso que não seja `+00:00`, o acidente acaba e a
 * sincronização começa a escolher a versão errada em silêncio.
 *
 * Comparar no instante custa um `Date.parse` e não depende de nada disso.
 */
function instante(iso: string): number {
  return Date.parse(iso)
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

  const aqui = instante(local.updated_at)
  const la = instante(remoto.updated_at)

  // Carimbo ilegível de algum dos lados: mantém o que está na tela. Trocar o
  // que a pessoa está vendo por causa de uma data que não deu para ler seria
  // o pior desfecho possível.
  if (Number.isNaN(aqui) || Number.isNaN(la)) return false

  return aqui < la
}

/**
 * O maior de dois carimbos de chegada, comparado por instante. `null` de um
 * lado perde; os dois `null` devolvem `null`.
 */
export function maiorCarimbo(a: string | null, b: string | null): string | null {
  if (a === null) return b
  if (b === null) return a

  const ia = instante(a)
  const ib = instante(b)
  if (Number.isNaN(ia)) return b
  if (Number.isNaN(ib)) return a

  return ia >= ib ? a : b
}

function paraNuvem(registro: RegistroBase, user_id: string) {
  return { ...registro, user_id }
}

/**
 * Tira do que veio da nuvem o que é escrituração do servidor: `user_id` é
 * sempre o mesmo e `synced_at` é carimbo de chegada. Nenhum dos dois pertence
 * ao registro local.
 */
function limparRemoto(bruto: Record<string, unknown>): {
  registro: RegistroBase
  synced_at: string | null
} {
  const {
    user_id: _ignorado,
    synced_at,
    ...limpo
  } = bruto as Record<string, unknown> & { user_id?: string; synced_at?: string }

  return {
    registro: limpo as unknown as RegistroBase,
    synced_at: typeof synced_at === 'string' ? synced_at : null,
  }
}

export async function sincronizar(): Promise<ResultadoSync> {
  const em = agoraISO()

  if (rodando) {
    return { estado: 'sincronizando', enviados: 0, recebidos: 0, pendentes: 0, em, ultima: null }
  }

  const sb = await obterSupabase()
  const conta = await sessaoAtual()

  if (!sb || !conta) {
    const pendentes = await db.sync_queue.count()
    return { estado: 'ocioso', enviados: 0, recebidos: 0, pendentes, em, ultima: null }
  }

  const chave = chaveUltima(conta.id)
  const marcaAnterior = localStorage.getItem(chave)

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const pendentes = await db.sync_queue.count()
    return { estado: 'pendente', enviados: 0, recebidos: 0, pendentes, em, ultima: marcaAnterior }
  }

  rodando = true
  let enviados = 0
  let recebidos = 0
  let erro: string | undefined
  let marcaNova: string | null = null

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
    const desde = marcaAnterior ?? INICIO_DOS_TEMPOS

    for (const tabela of TABELAS) {
      const { data, error } = await sb
        .from(tabela)
        .select('*')
        .gt('synced_at', desde)
        .order('synced_at', { ascending: true })

      if (error) {
        erro = error.message
        continue
      }

      for (const bruto of data ?? []) {
        const { registro, synced_at } = limparRemoto(bruto as Record<string, unknown>)

        // A marca d'água anda pelo que a resposta REALMENTE trouxe, nunca
        // pelo relógio daqui. Assim ela nunca passa por cima de uma linha que
        // ainda não desceu — inclusive a que outro aparelho estiver gravando
        // neste exato momento.
        marcaNova = maiorCarimbo(marcaNova, synced_at)

        const local = await db.table(tabela).get(registro.id)

        if (devoAceitarRemoto(local, registro)) {
          await db.table(tabela).put(registro)
          recebidos++
        }
      }
    }

    // Rodada limpa e sem linha nova: a marca fica onde estava. Não há para
    // onde avançar sem ter visto nada.
    if (!erro && marcaNova !== null) {
      localStorage.setItem(chave, marcaNova)
      descartarChaveAntiga()
    }
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
    ultima: localStorage.getItem(chave),
  }
}

export function ultimaSincronizacao(userId: string): string | null {
  return localStorage.getItem(chaveUltima(userId))
}

/**
 * Zera a marca d'água desta conta: a próxima sincronização baixa a nuvem
 * inteira de novo. É a saída para quando o aparelho e a nuvem discordam e
 * ninguém sabe por quê. Baixar de novo nunca apaga o que está aqui — o
 * desempate por updated_at mantém o local.
 */
export function esquecerSincronizacao(userId: string): void {
  localStorage.removeItem(chaveUltima(userId))
}
