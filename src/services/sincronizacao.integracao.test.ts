import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db/db'

/**
 * A `sincronizar()` inteira contra uma nuvem de mentira.
 *
 * Os testes vizinhos cobrem as regras puras. Estes cobrem a costura — e é na
 * costura que morava o defeito: a marca d'água era o relógio de quem lê,
 * comparada contra `updated_at`, que é o relógio de quem escreve. Registro
 * feito offline antes da última sincronização do outro aparelho nunca descia.
 *
 * A nuvem falsa imita o que importa do PostgREST: `synced_at` é carimbado
 * pelo servidor a cada gravação, o filtro compara por instante e a resposta
 * volta no formato do Postgres (`+00:00` com microssegundos), não no formato
 * do navegador. Assim o teste também exercita a mistura de formatos.
 */

type Linha = Record<string, unknown>

class NuvemFalsa {
  private tabelas = new Map<string, Map<string, Linha>>()
  /** Relógio do servidor, longe do relógio real para o teste não se confundir. */
  private relogio = Date.parse('2026-03-15T08:00:00.000Z')
  /** Quando preenchido, toda operação falha — é a rede caindo. */
  erro: string | null = null

  avancar(ms: number): void {
    this.relogio += ms
  }

  /** Formato do Postgres: microssegundos e `+00:00`, não o `Z` do navegador. */
  carimbo(): string {
    return `${new Date(this.relogio).toISOString().slice(0, 23)}000+00:00`
  }

  private tabela(nome: string): Map<string, Linha> {
    let t = this.tabelas.get(nome)
    if (!t) {
      t = new Map()
      this.tabelas.set(nome, t)
    }
    return t
  }

  /** Grava direto, sem passar pelo app — é o outro aparelho subindo algo. */
  semearOutroAparelho(nome: string, linha: Linha): void {
    this.tabela(nome).set(String(linha.id), { ...linha, synced_at: this.carimbo() })
  }

  linhasDe(nome: string): Linha[] {
    return Array.from(this.tabela(nome).values())
  }

  cliente() {
    const nuvem = this
    return {
      from(nome: string) {
        return {
          upsert(linha: Linha) {
            if (nuvem.erro) return Promise.resolve({ error: { message: nuvem.erro } })
            // O gatilho do banco sempre sobrescreve synced_at; o que o
            // cliente mandar nesse campo é ignorado, de propósito.
            nuvem.tabela(nome).set(String(linha.id), { ...linha, synced_at: nuvem.carimbo() })
            return Promise.resolve({ error: null })
          },
          select() {
            let linhas = nuvem.linhasDe(nome)
            const consulta = {
              gt(coluna: string, valor: string) {
                linhas = linhas.filter(
                  (l) => Date.parse(String(l[coluna])) > Date.parse(valor),
                )
                return consulta
              },
              order(coluna: string, { ascending }: { ascending: boolean }) {
                linhas = [...linhas].sort((a, b) => {
                  const d = Date.parse(String(a[coluna])) - Date.parse(String(b[coluna]))
                  return ascending ? d : -d
                })
                return consulta
              },
              then(resolver: (r: { data: Linha[] | null; error: unknown }) => unknown) {
                return Promise.resolve(
                  resolver(
                    nuvem.erro
                      ? { data: null, error: { message: nuvem.erro } }
                      : { data: linhas, error: null },
                  ),
                )
              },
            }
            return consulta
          },
        }
      },
    }
  }
}

let nuvem: NuvemFalsa
let contaId = 'conta-a'

vi.mock('./supabase', () => ({
  obterSupabase: () => Promise.resolve(nuvem.cliente()),
  supabaseConfigurado: () => true,
}))

vi.mock('./auth', () => ({
  sessaoAtual: () => Promise.resolve({ id: contaId, email: 'eu@exemplo.com', nome: null, criadaEm: null }),
}))

const { sincronizar, esquecerSincronizacao, ultimaSincronizacao } = await import('./sincronizacao')

/** Uma moto pronta para gravar, com o carimbo que o teste mandar. */
function moto(id: string, updated_at: string) {
  return {
    id,
    updated_at,
    deleted_at: null,
    apelido: `moto ${id}`,
    marca: 'Honda',
    modelo: 'CG 160 Fan',
    ano: 2024,
    placa: '',
    cor: '',
    km_inicial: 0,
    foto_url: null,
    criada_em: '2026-03-01',
    arquivada: false,
    perfil_uso: 'urbano_leve' as const,
  }
}

/** Grava local e enfileira, como o app faz numa escrita de verdade. */
async function gravarAqui(m: ReturnType<typeof moto>) {
  await db.motos.put(m)
  await db.sync_queue.add({
    tabela: 'motos',
    registro_id: m.id,
    operacao: 'upsert',
    criado_em: m.updated_at,
    tentativas: 0,
  })
}

beforeEach(() => {
  nuvem = new NuvemFalsa()
  contaId = 'conta-a'
})

describe('sincronizar — a marca d’água', () => {
  it('desce registro feito offline, mesmo com updated_at anterior à última sincronização', async () => {
    // Este é O teste. Antes da correção ele falhava, e falhava calado:
    // `estado: 'ok'`, `recebidos: 0`, e o abastecimento do celular
    // simplesmente não existia no PC.

    // 1. O PC cadastra uma moto e sincroniza. A marca d'água avança.
    await gravarAqui(moto('m1', '2026-03-15T08:00:00.000Z'))
    const primeira = await sincronizar()
    expect(primeira.estado).toBe('ok')
    expect(primeira.enviados).toBe(1)
    expect(primeira.ultima).not.toBeNull()

    // 2. Passa uma hora no servidor.
    nuvem.avancar(60 * 60 * 1000)

    // 3. O celular sobe agora um registro que ANOTOU ONTEM, sem sinal.
    //    Chegada de hoje, edição de ontem.
    const anotadoOntem = '2026-03-14T19:30:00.000Z'
    nuvem.semearOutroAparelho('motos', moto('m2', anotadoOntem))

    // O updated_at dele é anterior à marca d'água do PC — é exatamente essa
    // a situação que o filtro antigo descartava.
    expect(Date.parse(anotadoOntem)).toBeLessThan(Date.parse(primeira.ultima as string))

    // 4. O PC sincroniza de novo e tem que receber.
    const segunda = await sincronizar()
    expect(segunda.estado).toBe('ok')
    expect(segunda.recebidos).toBe(1)
    expect(await db.motos.get('m2')).toMatchObject({ id: 'm2', updated_at: anotadoOntem })
  })

  it('avança até o maior carimbo que a resposta trouxe, não até o relógio daqui', async () => {
    nuvem.semearOutroAparelho('motos', moto('m1', '2026-03-15T08:00:00.000Z'))
    nuvem.avancar(5000)
    nuvem.semearOutroAparelho('motos', moto('m2', '2026-03-15T08:00:00.000Z'))

    const r = await sincronizar()

    expect(r.recebidos).toBe(2)
    // O relógio do servidor de mentira está em março; o relógio real de quem
    // roda o teste, não. A marca tem que ser a do servidor.
    expect(r.ultima).toBe('2026-03-15T08:00:05.000000+00:00')
  })

  it('rodada sem novidade nenhuma deixa a marca onde estava', async () => {
    nuvem.semearOutroAparelho('motos', moto('m1', '2026-03-15T08:00:00.000Z'))
    const primeira = await sincronizar()
    const segunda = await sincronizar()

    expect(segunda.recebidos).toBe(0)
    expect(segunda.ultima).toBe(primeira.ultima)
  })

  it('rodada que deu erro não move a marca — senão o que faltou nunca mais desceria', async () => {
    nuvem.semearOutroAparelho('motos', moto('m1', '2026-03-15T08:00:00.000Z'))
    await sincronizar()
    const antes = ultimaSincronizacao(contaId)

    nuvem.avancar(1000)
    nuvem.semearOutroAparelho('motos', moto('m2', '2026-03-15T08:00:01.000Z'))
    nuvem.erro = 'rede caiu no meio'

    const r = await sincronizar()
    expect(r.estado).toBe('erro')
    expect(ultimaSincronizacao(contaId)).toBe(antes)

    // Com a rede de volta, o que faltou desce.
    nuvem.erro = null
    const depois = await sincronizar()
    expect(depois.recebidos).toBe(1)
    expect(await db.motos.get('m2')).toBeTruthy()
  })

  it('é por conta: entrar com outra conta não herda a marca da anterior', async () => {
    nuvem.semearOutroAparelho('motos', moto('m1', '2026-03-15T08:00:00.000Z'))
    await sincronizar()
    expect(ultimaSincronizacao('conta-a')).not.toBeNull()

    // Mesma máquina, outra pessoa entra. A nuvem de mentira é a mesma, mas o
    // que importa é a marca: a da conta B não existe, então ela baixa tudo.
    contaId = 'conta-b'
    expect(ultimaSincronizacao('conta-b')).toBeNull()

    await db.motos.clear()
    const r = await sincronizar()
    expect(r.recebidos).toBe(1)
  })

  it('esquecer a marca faz a nuvem inteira descer de novo, sem apagar o que está aqui', async () => {
    nuvem.semearOutroAparelho('motos', moto('m1', '2026-03-15T08:00:00.000Z'))
    await sincronizar()
    expect((await sincronizar()).recebidos).toBe(0)

    esquecerSincronizacao(contaId)

    const r = await sincronizar()
    expect(r.recebidos).toBe(0) // desceu de novo, mas empatou: o local ficou
    expect(await db.motos.get('m1')).toBeTruthy()
  })
})

describe('sincronizar — conflito de updated_at entre dois aparelhos', () => {
  it('a edição mais recente vence, mesmo tendo chegado antes', async () => {
    // O celular editou às 10:00 e subiu. O PC editou a MESMA moto às 10:05,
    // offline, e só agora sobe. Quem chegou por último no servidor é o PC, e
    // ele também é o mais novo: a versão dele vence dos dois lados.
    nuvem.semearOutroAparelho('motos', {
      ...moto('m1', '2026-03-15T10:00:00.000Z'),
      apelido: 'versão do celular',
    })

    await gravarAqui({ ...moto('m1', '2026-03-15T10:05:00.000Z'), apelido: 'versão do PC' })
    nuvem.avancar(60_000)

    const r = await sincronizar()

    expect(r.enviados).toBe(1)
    expect((await db.motos.get('m1'))?.apelido).toBe('versão do PC')
    expect(nuvem.linhasDe('motos')[0].apelido).toBe('versão do PC')
  })

  it('o remoto mais novo sobrescreve o local mais antigo', async () => {
    await db.motos.put(moto('m1', '2026-03-15T09:00:00.000Z'))
    nuvem.semearOutroAparelho('motos', {
      ...moto('m1', '2026-03-15T11:00:00.000Z'),
      apelido: 'versão do celular',
    })

    const r = await sincronizar()

    expect(r.recebidos).toBe(1)
    expect((await db.motos.get('m1'))?.apelido).toBe('versão do celular')
  })

  it('o remoto mais antigo não encosta no local mais novo', async () => {
    await db.motos.put({ ...moto('m1', '2026-03-15T11:00:00.000Z'), apelido: 'versão do PC' })
    nuvem.semearOutroAparelho('motos', {
      ...moto('m1', '2026-03-15T09:00:00.000Z'),
      apelido: 'versão do celular',
    })

    const r = await sincronizar()

    expect(r.recebidos).toBe(0)
    expect((await db.motos.get('m1'))?.apelido).toBe('versão do PC')
  })

  it('o que veio da nuvem não guarda escrituração do servidor', async () => {
    nuvem.semearOutroAparelho('motos', moto('m1', '2026-03-15T08:00:00.000Z'))
    await sincronizar()

    const guardado = (await db.motos.get('m1')) as unknown as Record<string, unknown>
    expect(guardado).not.toHaveProperty('user_id')
    expect(guardado).not.toHaveProperty('synced_at')
  })
})

describe('sincronizar — a fila', () => {
  it('operação que falha continua na fila, com a tentativa contada', async () => {
    await gravarAqui(moto('m1', '2026-03-15T08:00:00.000Z'))
    nuvem.erro = 'sem rede'

    const r = await sincronizar()

    expect(r.estado).toBe('erro')
    expect(r.enviados).toBe(0)
    expect(r.pendentes).toBe(1)
    expect((await db.sync_queue.toArray())[0].tentativas).toBe(1)
  })

  it('dez edições da mesma moto sobem uma vez só', async () => {
    for (let i = 0; i < 10; i++) {
      await db.motos.put(moto('m1', `2026-03-15T08:00:0${i}.000Z`))
      await db.sync_queue.add({
        tabela: 'motos',
        registro_id: 'm1',
        operacao: 'upsert',
        criado_em: `2026-03-15T08:00:0${i}.000Z`,
        tentativas: 0,
      })
    }

    const r = await sincronizar()

    expect(r.enviados).toBe(1)
    expect(r.pendentes).toBe(0)
    expect(nuvem.linhasDe('motos')).toHaveLength(1)
  })
})
