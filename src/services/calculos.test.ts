import { describe, expect, it } from 'vitest'
import {
  calcularConsumo,
  calcularVencimento,
  calcularVencimentos,
  estimarKm,
  resumirCustos,
} from './calculos'
import type {
  Abastecimento,
  Despesa,
  ItemManutencao,
  LeituraOdometro,
  Moto,
  Servico,
} from '@/types'

const HOJE = '2026-08-19'

const base = { updated_at: '2026-08-19T12:00:00.000Z', deleted_at: null }

const moto: Moto = {
  ...base,
  id: 'm1',
  apelido: 'Fanzoca',
  marca: 'Honda',
  modelo: 'CG 160 Fan',
  ano: 2022,
  placa: 'ABC1D23',
  cor: 'Preta',
  km_inicial: 10000,
  foto_url: null,
  criada_em: '2026-01-01',
  arquivada: false,
  perfil_uso: 'urbano_leve',
}

function leitura(id: string, data: string, km: number): LeituraOdometro {
  return { ...base, id, moto_id: 'm1', data, km, origem: 'manual' }
}

function servico(id: string, data: string, km: number | null, valor: number | null): Servico {
  return {
    ...base,
    id,
    moto_id: 'm1',
    item_id: 'i1',
    descricao: 'Óleo do motor',
    data,
    km,
    valor,
    local: '',
    observacao: '',
    foto_url: null,
  }
}

const itemOleo: ItemManutencao = {
  ...base,
  id: 'i1',
  moto_id: 'm1',
  nome: 'Óleo do motor',
  categoria: 'motor',
  intervalo_km: 3000,
  intervalo_dias: 180,
  ativo: true,
  observacao: '',
  fonte: 'padrao',
}

describe('estimarKm', () => {
  it('sem leitura nenhuma, devolve o km inicial e não chama de estimativa', () => {
    const r = estimarKm([], moto, HOJE)
    expect(r.km).toBe(10000)
    expect(r.estimado).toBe(false)
    expect(r.kmPorDia).toBeNull()
  })

  it('com uma leitura só, usa a leitura crua sem projetar', () => {
    const r = estimarKm([leitura('l1', '2026-08-09', 11000)], moto, HOJE)
    expect(r.km).toBe(11000)
    expect(r.estimado).toBe(false)
  })

  it('com duas leituras, projeta pela média de km/dia', () => {
    const r = estimarKm(
      [leitura('l1', '2026-06-20', 10000), leitura('l2', '2026-08-09', 11000)],
      moto,
      HOJE,
    )
    // 1000 km em 50 dias = 20 km/dia; 10 dias desde a última leitura.
    expect(r.kmPorDia).toBe(20)
    expect(r.km).toBe(11200)
    expect(r.estimado).toBe(true)
  })

  it('leitura de hoje não vira projeção', () => {
    const r = estimarKm(
      [leitura('l1', '2026-06-20', 10000), leitura('l2', HOJE, 11200)],
      moto,
      HOJE,
    )
    expect(r.km).toBe(11200)
    expect(r.estimado).toBe(false)
  })

  it('ignora leituras fora da janela de 90 dias quando há dados recentes', () => {
    const r = estimarKm(
      [
        leitura('l0', '2024-01-01', 0),
        leitura('l1', '2026-06-20', 10000),
        leitura('l2', '2026-08-09', 11000),
      ],
      moto,
      HOJE,
    )
    expect(r.kmPorDia).toBe(20)
  })

  it('odômetro parado não gera projeção maluca', () => {
    const r = estimarKm(
      [leitura('l1', '2026-06-20', 11000), leitura('l2', '2026-08-09', 11000)],
      moto,
      HOJE,
    )
    expect(r.km).toBe(11000)
    expect(r.estimado).toBe(false)
  })
})

describe('calcularVencimento', () => {
  it('vence pelo que chegar primeiro — aqui, o prazo em dias', () => {
    const v = calcularVencimento(itemOleo, [servico('s1', '2026-06-01', 10500, 80)], moto, 11200, HOJE)
    expect(v.kmRestante).toBe(2300)
    expect(v.diasRestante).toBe(101)
    expect(v.vencePor).toBe('dias')
    expect(v.status).toBe('verde')
    expect(v.semHistorico).toBe(false)
  })

  it('fica amarelo com 20% ou menos de folga', () => {
    const v = calcularVencimento(itemOleo, [servico('s1', '2026-06-01', 10500, 80)], moto, 13200, HOJE)
    expect(v.kmRestante).toBe(300)
    expect(v.vencePor).toBe('km')
    expect(v.status).toBe('amarelo')
  })

  it('fica vermelho quando passou do ponto', () => {
    const v = calcularVencimento(itemOleo, [servico('s1', '2026-06-01', 10500, 80)], moto, 14000, HOJE)
    expect(v.kmRestante).toBe(-500)
    expect(v.status).toBe('vermelho')
    expect(v.resumo).toBe('passou 500 km')
  })

  it('sem serviço registrado, conta a partir do cadastro e avisa', () => {
    const v = calcularVencimento(itemOleo, [], moto, 11200, HOJE)
    expect(v.semHistorico).toBe(true)
    expect(v.ultimoServico).toBeNull()
    // 10000 + 3000 - 11200
    expect(v.kmRestante).toBe(1800)
  })

  it('item só por prazo funciona sem km nenhum', () => {
    const calibragem: ItemManutencao = {
      ...itemOleo,
      id: 'i2',
      nome: 'Calibragem dos pneus',
      categoria: 'pneus',
      intervalo_km: null,
      intervalo_dias: 7,
    }
    const v = calcularVencimento(calibragem, [], moto, 11200, HOJE)
    expect(v.kmRestante).toBeNull()
    expect(v.vencePor).toBe('dias')
    expect(v.status).toBe('vermelho')
  })

  it('usa o serviço mais recente quando há vários', () => {
    const v = calcularVencimento(
      itemOleo,
      [servico('s1', '2026-02-01', 10100, 70), servico('s2', '2026-06-01', 10500, 80)],
      moto,
      11200,
      HOJE,
    )
    expect(v.ultimoServico?.id).toBe('s2')
  })
})

describe('calcularVencimentos — ordem da lista', () => {
  function item(id: string, nome: string, km: number | null, dias: number | null): ItemManutencao {
    return { ...itemOleo, id, nome, intervalo_km: km, intervalo_dias: dias }
  }

  it('numa moto recém-cadastrada, empatada em 100%, o prazo manda na frente do km', () => {
    const motoNova = { ...moto, criada_em: HOJE }
    // Ordem de entrada embaralhada de propósito: é o que o IndexedDB devolve.
    const itens = [
      item('i-ar', 'Filtro de ar', 10000, null),
      item('i-corrente', 'Lubrificação da corrente', 500, 15),
      item('i-calibra', 'Calibragem dos pneus', null, 7),
      item('i-pneu', 'Pneu dianteiro', 1000, null),
    ]
    const vencimentos = calcularVencimentos(itens, [], motoNova, motoNova.km_inicial, HOJE)
    // Todos realmente empatados — o desempate é que está sendo testado.
    expect(vencimentos.every((v) => v.fracaoRestante === 1)).toBe(true)
    const nomes = vencimentos.map((v) => v.item.nome)

    expect(nomes).toEqual([
      'Calibragem dos pneus',
      'Lubrificação da corrente',
      'Pneu dianteiro',
      'Filtro de ar',
    ])
  })

  it('quem está vencido vem antes de quem está em dia', () => {
    const itens = [item('i-ar', 'Filtro de ar', 10000, null), item('i-calibra', 'Calibragem', null, 7)]
    // 200 dias depois do cadastro a calibragem está muito vencida.
    const nomes = calcularVencimentos(itens, [], moto, moto.km_inicial, '2026-07-20').map(
      (v) => v.item.nome,
    )
    expect(nomes[0]).toBe('Calibragem')
  })

  it('não devolve item desativado', () => {
    const itens = [
      { ...item('i-ar', 'Filtro de ar', 10000, null), ativo: false },
      item('i-calibra', 'Calibragem', null, 7),
    ]
    expect(calcularVencimentos(itens, [], moto, moto.km_inicial, HOJE)).toHaveLength(1)
  })
})

function abastecimento(
  id: string,
  km: number | null,
  litros: number | null,
  valor: number,
  cheio: boolean,
  data = '2026-08-01',
): Abastecimento {
  return {
    ...base,
    id,
    moto_id: 'm1',
    data,
    km,
    litros,
    valor_total: valor,
    valor_litro: litros ? valor / litros : null,
    tipo_combustivel: 'gasolina',
    tanque_cheio: cheio,
    posto: '',
  }
}

describe('calcularConsumo', () => {
  it('mede de tanque cheio a tanque cheio', () => {
    const c = calcularConsumo([
      abastecimento('a1', 10000, 10, 60, true),
      abastecimento('a2', 10300, 10, 60, true),
      abastecimento('a3', 10600, 12, 72, true),
    ])
    expect(c.trechos).toBe(2)
    expect(c.kmRodados).toBe(600)
    expect(c.litros).toBe(22)
    expect(c.kmPorLitro).toBeCloseTo(27.27, 2)
  })

  it('ignora abastecimento parcial', () => {
    const c = calcularConsumo([
      abastecimento('a1', 10000, 10, 60, true),
      abastecimento('a2', 10150, 5, 30, false),
      abastecimento('a3', 10300, 10, 60, true),
    ])
    expect(c.trechos).toBe(1)
    expect(c.kmPorLitro).toBe(30)
  })

  it('sem dois tanques cheios, não inventa consumo', () => {
    expect(calcularConsumo([abastecimento('a1', 10000, 10, 60, true)]).kmPorLitro).toBeNull()
    expect(calcularConsumo([]).kmPorLitro).toBeNull()
  })

  it('ignora abastecimento sem km', () => {
    const c = calcularConsumo([
      abastecimento('a1', 10000, 10, 60, true),
      abastecimento('a2', null, 10, 60, true),
    ])
    expect(c.kmPorLitro).toBeNull()
  })
})

describe('resumirCustos', () => {
  const despesa: Despesa = {
    ...base,
    id: 'd1',
    moto_id: 'm1',
    data: '2026-08-05',
    categoria: 'pedagio',
    descricao: 'pedágio',
    valor: 10,
  }

  it('soma por tipo e calcula custo por km no período', () => {
    const r = resumirCustos(
      [servico('s1', '2026-08-02', 11000, 80)],
      [abastecimento('a1', 11000, 10, 60, true, '2026-08-02')],
      [despesa],
      [leitura('l1', '2026-08-01', 11000), leitura('l2', '2026-08-16', 11300)],
      '2026-08-01',
      '2026-08-31',
    )
    expect(r.manutencao).toBe(80)
    expect(r.combustivel).toBe(60)
    expect(r.outras).toBe(10)
    expect(r.total).toBe(150)
    expect(r.kmRodados).toBe(300)
    expect(r.custoPorKm).toBe(0.5)
  })

  it('sem km rodado no período, não devolve custo por km', () => {
    const r = resumirCustos([], [], [despesa], [], '2026-08-01', '2026-08-31')
    expect(r.custoPorKm).toBeNull()
    expect(r.total).toBe(10)
  })

  it('respeita o recorte de período', () => {
    const r = resumirCustos([servico('s1', '2026-07-02', 10800, 80)], [], [despesa], [], '2026-08-01', '2026-08-31')
    expect(r.manutencao).toBe(0)
    expect(r.total).toBe(10)
  })
})
