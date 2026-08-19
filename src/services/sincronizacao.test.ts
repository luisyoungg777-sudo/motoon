import { describe, expect, it } from 'vitest'
import { deduplicarFila, devoAceitarRemoto } from './sincronizacao'

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
})
