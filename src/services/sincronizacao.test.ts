import { describe, expect, it } from 'vitest'
import { deduplicarFila, devoAceitarRemoto, maiorCarimbo } from './sincronizacao'

type Item = { seq: number; tabela: string; registro_id: string; operacao: 'upsert' | 'delete' }

const fila = (...itens: [number, string, string, 'upsert' | 'delete'][]): Item[] =>
  itens.map(([seq, tabela, registro_id, operacao]) => ({ seq, tabela, registro_id, operacao }))

describe('deduplicarFila', () => {
  it('fila vazia não quebra', () => {
    expect(deduplicarFila([])).toEqual({ itens: [], seqsObsoletas: [] })
  })

  it('sem repetição, mantém tudo', () => {
    const f = fila([1, 'motos', 'a', 'upsert'], [2, 'servicos', 'b', 'upsert'])
    const r = deduplicarFila(f)
    expect(r.itens).toHaveLength(2)
    expect(r.seqsObsoletas).toEqual([])
  })

  it('dez edições da mesma moto viram um envio só', () => {
    const f = fila(
      ...Array.from(
        { length: 10 },
        (_, i) => [i + 1, 'motos', 'a', 'upsert'] as [number, string, string, 'upsert'],
      ),
    )
    const r = deduplicarFila(f)
    expect(r.itens).toHaveLength(1)
    expect(r.seqsObsoletas).toHaveLength(9)
  })

  it('mantém a entrada mais recente, não a primeira', () => {
    const f = fila([1, 'motos', 'a', 'upsert'], [7, 'motos', 'a', 'delete'])
    const r = deduplicarFila(f)
    expect(r.itens[0].seq).toBe(7)
    expect(r.itens[0].operacao).toBe('delete')
    expect(r.seqsObsoletas).toEqual([1])
  })

  it('não confunde mesmo id em tabelas diferentes', () => {
    const f = fila([1, 'motos', 'x', 'upsert'], [2, 'servicos', 'x', 'upsert'])
    expect(deduplicarFila(f).itens).toHaveLength(2)
  })

  it('exclusão depois de edição vence — o registro foi apagado', () => {
    const f = fila(
      [1, 'servicos', 's1', 'upsert'],
      [2, 'servicos', 's1', 'upsert'],
      [3, 'servicos', 's1', 'delete'],
    )
    const r = deduplicarFila(f)
    expect(r.itens).toHaveLength(1)
    expect(r.itens[0].operacao).toBe('delete')
  })

  it('nenhuma seq viva entra na lista de obsoletas', () => {
    const f = fila([1, 'motos', 'a', 'upsert'], [2, 'motos', 'a', 'upsert'], [3, 'motos', 'b', 'upsert'])
    const r = deduplicarFila(f)
    const vivas = r.itens.map((i) => i.seq)
    expect(r.seqsObsoletas.some((s) => vivas.includes(s))).toBe(false)
  })
})

describe('devoAceitarRemoto', () => {
  const t = (iso: string) => ({ updated_at: iso })

  it('registro que não existe aqui sempre entra', () => {
    expect(devoAceitarRemoto(undefined, t('2026-01-01T00:00:00.000Z'))).toBe(true)
    expect(devoAceitarRemoto(null, t('2026-01-01T00:00:00.000Z'))).toBe(true)
  })

  it('remoto mais novo vence', () => {
    expect(devoAceitarRemoto(t('2026-08-01T10:00:00.000Z'), t('2026-08-02T10:00:00.000Z'))).toBe(true)
  })

  it('local mais novo é preservado — edição offline não se perde', () => {
    expect(devoAceitarRemoto(t('2026-08-03T10:00:00.000Z'), t('2026-08-02T10:00:00.000Z'))).toBe(
      false,
    )
  })

  it('empate mantém o local, que é o que está na tela', () => {
    const mesmo = '2026-08-02T10:00:00.000Z'
    expect(devoAceitarRemoto(t(mesmo), t(mesmo))).toBe(false)
  })

  it('compara por instante, não por dia', () => {
    expect(devoAceitarRemoto(t('2026-08-02T10:00:00.000Z'), t('2026-08-02T10:00:00.001Z'))).toBe(
      true,
    )
  })

  // O navegador grava `.123Z`; o Postgres devolve `+00:00`, com
  // microssegundos e sem os zeros do fim. É esse par que a sincronização
  // compara de verdade — nunca dois carimbos do mesmo formato.
  describe('formato do navegador contra formato do Postgres', () => {
    it('remoto do Postgres mais novo vence, apesar do outro formato', () => {
      expect(
        devoAceitarRemoto(t('2026-08-20T14:03:11.123Z'), t('2026-08-20T14:03:11.567890+00:00')),
      ).toBe(true)
    })

    it('local mais novo resiste a um remoto com mais casas decimais', () => {
      expect(
        devoAceitarRemoto(t('2026-08-20T14:03:11.900Z'), t('2026-08-20T14:03:11.123456+00:00')),
      ).toBe(false)
    })

    it('mesmo instante em formatos diferentes é empate, e empate mantém o local', () => {
      expect(
        devoAceitarRemoto(t('2026-08-20T14:03:11.500Z'), t('2026-08-20T14:03:11.5+00:00')),
      ).toBe(false)
    })

    it('segundo cheio do Postgres vem sem fração nenhuma', () => {
      expect(devoAceitarRemoto(t('2026-08-20T14:03:11.999Z'), t('2026-08-20T14:03:12+00:00'))).toBe(
        true,
      )
      expect(devoAceitarRemoto(t('2026-08-20T14:03:12.001Z'), t('2026-08-20T14:03:12+00:00'))).toBe(
        false,
      )
    })

    it('microssegundo abaixo do milissegundo não desempata — e não deve mesmo', () => {
      // O Dexie só guarda milissegundo. Deixar `.123456` ganhar de `.123`
      // trocaria o registro da tela por um idêntico, a cada sincronização.
      expect(
        devoAceitarRemoto(t('2026-08-20T14:03:11.123Z'), t('2026-08-20T14:03:11.123456+00:00')),
      ).toBe(false)
    })
  })

  it('carimbo ilegível mantém o que está na tela', () => {
    expect(devoAceitarRemoto(t('2026-08-20T14:03:11.123Z'), t('nao é data'))).toBe(false)
    expect(devoAceitarRemoto(t('vazio'), t('2026-08-20T14:03:11.123Z'))).toBe(false)
  })
})

describe('maiorCarimbo', () => {
  const A = '2026-08-20T14:03:11.100000+00:00'
  const B = '2026-08-20T14:03:11.200000+00:00'

  it('sem carimbo nenhum, não há para onde avançar', () => {
    expect(maiorCarimbo(null, null)).toBeNull()
  })

  it('primeiro carimbo da rodada vira a marca', () => {
    expect(maiorCarimbo(null, A)).toBe(A)
    expect(maiorCarimbo(A, null)).toBe(A)
  })

  it('fica com o mais recente, venha em que ordem vier', () => {
    expect(maiorCarimbo(A, B)).toBe(B)
    expect(maiorCarimbo(B, A)).toBe(B)
  })

  it('empate devolve um dos dois, sem oscilar', () => {
    expect(maiorCarimbo(A, A)).toBe(A)
  })

  it('carimbo ilegível perde para o que dá para ler', () => {
    expect(maiorCarimbo('sei lá', A)).toBe(A)
    expect(maiorCarimbo(A, 'sei lá')).toBe(A)
  })

  it('devolve a string original, não uma reformatada — é ela que volta para o servidor', () => {
    // A marca d'água é reenviada crua em `.gt('synced_at', desde)`. Se esta
    // função normalizasse o texto, a precisão em microssegundos se perderia e
    // a linha da borda desceria de novo a cada rodada, para sempre.
    const cru = '2026-08-20T14:03:11.123456+00:00'
    expect(maiorCarimbo(null, cru)).toBe(cru)
  })

  it('a marca só anda para a frente ao longo de uma rodada', () => {
    const chegando = [B, A, '2026-08-20T14:03:11.150000+00:00']
    let marca: string | null = null
    for (const c of chegando) marca = maiorCarimbo(marca, c)
    expect(marca).toBe(B)
  })
})
