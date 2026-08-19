import { describe, expect, it } from 'vitest'
import { parseFrase, parseTexto } from './parser'

const HOJE = '2026-08-19'
const opts = { hoje: HOJE }

describe('parser — a tabela da especificação', () => {
  it('gasolina 50', () => {
    const l = parseFrase('gasolina 50', opts)
    expect(l.tipo).toBe('abastecimento')
    expect(l.valor).toBe(50)
    expect(l.tipoCombustivel).toBe('gasolina')
    expect(l.km).toBeNull()
    expect(l.data).toBe(HOJE)
    expect(l.camposFaltando).toEqual([])
  })

  it('gasolina 50 reais 12500 km', () => {
    const l = parseFrase('gasolina 50 reais 12500 km', opts)
    expect(l.tipo).toBe('abastecimento')
    expect(l.valor).toBe(50)
    expect(l.km).toBe(12500)
  })

  it('abasteci 20 litros 110', () => {
    const l = parseFrase('abasteci 20 litros 110', opts)
    expect(l.tipo).toBe('abastecimento')
    expect(l.litros).toBe(20)
    expect(l.valor).toBe(110)
  })

  it('pedagio 10', () => {
    const l = parseFrase('pedagio 10', opts)
    expect(l.tipo).toBe('despesa')
    expect(l.categoriaDespesa).toBe('pedagio')
    expect(l.valor).toBe(10)
  })

  it('troquei o oleo 80', () => {
    const l = parseFrase('troquei o oleo 80', opts)
    expect(l.tipo).toBe('servico')
    expect(l.itemNome).toBe('Óleo do motor')
    expect(l.valor).toBe(80)
  })

  it('lubrifiquei a corrente', () => {
    const l = parseFrase('lubrifiquei a corrente', opts)
    expect(l.tipo).toBe('servico')
    expect(l.itemNome).toBe('Lubrificação da corrente')
    expect(l.valor).toBeNull()
    // Serviço sem valor é um lançamento completo, não um campo faltando.
    expect(l.camposFaltando).toEqual([])
    expect(l.confianca).toBe('alta')
  })

  it('pastilha de freio 120 ontem', () => {
    const l = parseFrase('pastilha de freio 120 ontem', opts)
    expect(l.tipo).toBe('servico')
    expect(l.itemNome).toBe('Pastilhas de freio')
    expect(l.valor).toBe(120)
    expect(l.data).toBe('2026-08-18')
  })

  it('lavagem 25', () => {
    const l = parseFrase('lavagem 25', opts)
    expect(l.tipo).toBe('despesa')
    expect(l.categoriaDespesa).toBe('lavagem')
    expect(l.valor).toBe(25)
  })
})

describe('parser — acentos, caixa e erro de digitação', () => {
  it('aceita a frase acentuada e em caixa alta', () => {
    const l = parseFrase('PEDÁGIO 10', opts)
    expect(l.categoriaDespesa).toBe('pedagio')
    expect(l.valor).toBe(10)
  })

  it('entende óleo escrito com acento', () => {
    expect(parseFrase('óleo 90', opts).itemNome).toBe('Óleo do motor')
  })

  it('perdoa erro de digitação e baixa a confiança', () => {
    const l = parseFrase('gasolinaa 50', opts)
    expect(l.tipo).toBe('abastecimento')
    expect(l.confianca).toBe('media')
  })

  it('não confunde óleo de freio com óleo do motor', () => {
    const l = parseFrase('troquei o oleo de freio 90', opts)
    expect(l.itemNome).toBe('Óleo/fluido de freio')
  })

  it('pega o combustível certo mesmo com o verbo na frente', () => {
    const l = parseFrase('abasteci alcool 60', opts)
    expect(l.tipoCombustivel).toBe('etanol')
  })
})

describe('parser — números', () => {
  it('valor com vírgula', () => {
    expect(parseFrase('gasolina 49,90', opts).valor).toBeCloseTo(49.9)
  })

  it('odômetro com separador de milhar', () => {
    const l = parseFrase('gasolina 50 12.500 km', opts)
    expect(l.valor).toBe(50)
    expect(l.km).toBe(12500)
  })

  it('número grande sem unidade vira odômetro, não valor', () => {
    const l = parseFrase('gasolina 12500', opts)
    expect(l.km).toBe(12500)
    expect(l.valor).toBeNull()
  })

  it('R$ explícito é sempre valor', () => {
    const l = parseFrase('seguro R$ 1200', opts)
    expect(l.valor).toBe(1200)
    expect(l.km).toBeNull()
  })

  it('não chuta o segundo número solto — devolve como ignorado', () => {
    const l = parseFrase('gasolina 50 30', opts)
    expect(l.valor).toBe(50)
    expect(l.numerosIgnorados).toEqual([30])
    expect(l.confianca).toBe('media')
  })
})

describe('parser — datas', () => {
  it('hoje é o padrão quando não há data', () => {
    expect(parseFrase('lavagem 25', opts).data).toBe(HOJE)
  })

  it('anteontem', () => {
    expect(parseFrase('pedagio 10 anteontem', opts).data).toBe('2026-08-17')
  })

  it('dd/mm assume o ano corrente', () => {
    expect(parseFrase('ipva 300 12/03', opts).data).toBe('2026-03-12')
  })

  it('dd/mm no futuro cai para o ano anterior', () => {
    expect(parseFrase('ipva 300 12/12', opts).data).toBe('2025-12-12')
  })

  it('dd/mm/aaaa completo', () => {
    expect(parseFrase('multa 195 05/01/2025', opts).data).toBe('2025-01-05')
  })

  it('dia 12 usa o mês corrente', () => {
    expect(parseFrase('lavagem 25 dia 12', opts).data).toBe('2026-08-12')
    expect(parseFrase('lavagem 25 dia 12', opts).valor).toBe(25)
  })

  it('dia ainda não chegado cai para o mês anterior', () => {
    expect(parseFrase('lavagem 25 dia 25', opts).data).toBe('2026-07-25')
  })
})

describe('parser — casos ruins', () => {
  it('frase vazia não vira lançamento', () => {
    expect(parseTexto('', opts)).toEqual([])
    expect(parseTexto('   \n  \n', opts)).toEqual([])
  })

  it('só número: guarda o valor mas admite que não sabe o tipo', () => {
    const l = parseFrase('50', opts)
    expect(l.tipo).toBeNull()
    expect(l.valor).toBe(50)
    expect(l.confianca).toBe('baixa')
    expect(l.camposFaltando).toContain('tipo')
  })

  it('palavra desconhecida não inventa tipo', () => {
    const l = parseFrase('xablau 30', opts)
    expect(l.tipo).toBeNull()
    expect(l.camposFaltando).toContain('tipo')
  })

  it('abastecimento sem valor marca o campo como faltando', () => {
    const l = parseFrase('abasteci 20 litros', opts)
    expect(l.valor).toBeNull()
    expect(l.camposFaltando).toContain('valor')
  })
})

describe('parser — várias linhas', () => {
  it('três linhas viram três lançamentos', () => {
    const l = parseTexto('gasolina 50\npedagio 10\nlavagem 25', opts)
    expect(l).toHaveLength(3)
    expect(l.map((x) => x.tipo)).toEqual(['abastecimento', 'despesa', 'despesa'])
    expect(l.map((x) => x.valor)).toEqual([50, 10, 25])
  })

  it('ponto e vírgula também separa', () => {
    expect(parseTexto('gasolina 50; pedagio 10', opts)).toHaveLength(2)
  })

  it('quebra no " e " quando os dois lados se sustentam sozinhos', () => {
    const l = parseTexto('gasolina 50 e pedagio 10', opts)
    expect(l).toHaveLength(2)
    expect(l[1].categoriaDespesa).toBe('pedagio')
  })

  it('não quebra "coroa e pinhão" — é um serviço só', () => {
    const l = parseTexto('troquei coroa e pinhao', opts)
    expect(l).toHaveLength(1)
    expect(l[0].itemNome).toBe('Kit relação (corrente, coroa, pinhão)')
  })

  it('não quebra frase sem número', () => {
    expect(parseTexto('lubrifiquei a corrente e calibrei', opts)).toHaveLength(1)
  })
})
