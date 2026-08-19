import { diasEntre, formatarData, hojeISO, somarDias, textoDias } from './datas'
import { formatarKm } from './formato'
import type {
  Abastecimento,
  Despesa,
  ItemManutencao,
  LeituraOdometro,
  Moto,
  Servico,
} from '@/types'

export const JANELA_MEDIA_DIAS = 90

export interface EstimativaKm {
  km: number
  /** true quando o número foi projetado, e não lido do odômetro. */
  estimado: boolean
  kmPorDia: number | null
  ultimaLeitura: LeituraOdometro | null
}

function ordenar(leituras: LeituraOdometro[]): LeituraOdometro[] {
  return [...leituras].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.km - b.km))
}

/**
 * Km atual: projeta a partir da última leitura usando a média de km/dia
 * dos últimos 90 dias. Com menos de duas leituras, não projeta nada.
 */
export function estimarKm(
  leituras: LeituraOdometro[],
  moto: Moto,
  hoje: string = hojeISO(),
): EstimativaKm {
  const ordenadas = ordenar(leituras)

  if (ordenadas.length === 0) {
    return { km: moto.km_inicial, estimado: false, kmPorDia: null, ultimaLeitura: null }
  }

  const ultima = ordenadas[ordenadas.length - 1]

  if (ordenadas.length === 1) {
    return { km: ultima.km, estimado: false, kmPorDia: null, ultimaLeitura: ultima }
  }

  const corte = somarDias(hoje, -JANELA_MEDIA_DIAS)
  const janela = ordenadas.filter((l) => l.data >= corte)
  const base = janela.length >= 2 ? janela : ordenadas.slice(-2)

  const primeira = base[0]
  const dias = diasEntre(primeira.data, ultima.data)
  const rodados = ultima.km - primeira.km

  if (dias <= 0 || rodados <= 0) {
    return { km: ultima.km, estimado: false, kmPorDia: null, ultimaLeitura: ultima }
  }

  const kmPorDia = rodados / dias
  const diasDesdeUltima = Math.max(0, diasEntre(ultima.data, hoje))
  const projetado = Math.round(ultima.km + kmPorDia * diasDesdeUltima)

  return {
    km: projetado,
    estimado: diasDesdeUltima > 0,
    kmPorDia: Number(kmPorDia.toFixed(2)),
    ultimaLeitura: ultima,
  }
}

// ------------------------------------------------------------ vencimentos

export type StatusVencimento = 'verde' | 'amarelo' | 'vermelho'

export const COR_STATUS: Record<StatusVencimento, string> = {
  verde: '#10B981',
  amarelo: '#F59E0B',
  vermelho: '#EF4444',
}

export interface Vencimento {
  item: ItemManutencao
  ultimoServico: Servico | null
  /** true quando o item nunca foi feito — a conta parte do cadastro da moto. */
  semHistorico: boolean
  kmRestante: number | null
  diasRestante: number | null
  /** 1 = acabou de fazer, 0 = vence agora, negativo = vencido. */
  fracaoRestante: number | null
  vencePor: 'km' | 'dias' | null
  status: StatusVencimento
  resumo: string
}

export function calcularVencimento(
  item: ItemManutencao,
  servicosDoItem: Servico[],
  moto: Moto,
  kmAtual: number,
  hoje: string = hojeISO(),
): Vencimento {
  const feitos = [...servicosDoItem].sort((a, b) => (a.data < b.data ? 1 : -1))
  const ultimo = feitos[0] ?? null
  const semHistorico = ultimo === null

  const kmBase = ultimo?.km ?? moto.km_inicial
  const dataBase = ultimo?.data ?? moto.criada_em

  let kmRestante: number | null = null
  let fracKm: number | null = null
  if (item.intervalo_km !== null && item.intervalo_km > 0) {
    kmRestante = kmBase + item.intervalo_km - kmAtual
    fracKm = kmRestante / item.intervalo_km
  }

  let diasRestante: number | null = null
  let fracDias: number | null = null
  if (item.intervalo_dias !== null && item.intervalo_dias > 0) {
    const alvo = somarDias(dataBase, item.intervalo_dias)
    diasRestante = diasEntre(hoje, alvo)
    fracDias = diasRestante / item.intervalo_dias
  }

  let fracaoRestante: number | null = null
  let vencePor: 'km' | 'dias' | null = null

  if (fracKm !== null && fracDias !== null) {
    vencePor = fracKm <= fracDias ? 'km' : 'dias'
    fracaoRestante = Math.min(fracKm, fracDias)
  } else if (fracKm !== null) {
    vencePor = 'km'
    fracaoRestante = fracKm
  } else if (fracDias !== null) {
    vencePor = 'dias'
    fracaoRestante = fracDias
  }

  const status: StatusVencimento =
    fracaoRestante === null ? 'verde' : fracaoRestante <= 0 ? 'vermelho' : fracaoRestante <= 0.2 ? 'amarelo' : 'verde'

  return {
    item,
    ultimoServico: ultimo,
    semHistorico,
    kmRestante,
    diasRestante,
    fracaoRestante,
    vencePor,
    status,
    resumo: textoResumo(vencePor, kmRestante, diasRestante),
  }
}

function textoResumo(
  vencePor: 'km' | 'dias' | null,
  kmRestante: number | null,
  diasRestante: number | null,
): string {
  if (vencePor === 'km' && kmRestante !== null) {
    if (kmRestante > 0) return `faltam ${formatarKm(kmRestante)}`
    if (kmRestante === 0) return 'vence agora'
    return `passou ${formatarKm(Math.abs(kmRestante))}`
  }
  if (vencePor === 'dias' && diasRestante !== null) return textoDias(diasRestante)
  return 'sem intervalo definido'
}

/** Lista o que está vencendo, do mais urgente para o menos. */
export function calcularVencimentos(
  itens: ItemManutencao[],
  servicos: Servico[],
  moto: Moto,
  kmAtual: number,
  hoje: string = hojeISO(),
): Vencimento[] {
  const porItem = new Map<string, Servico[]>()
  for (const s of servicos) {
    if (!s.item_id) continue
    const lista = porItem.get(s.item_id) ?? []
    lista.push(s)
    porItem.set(s.item_id, lista)
  }

  return itens
    .filter((i) => i.ativo)
    .map((i) => calcularVencimento(i, porItem.get(i.id) ?? [], moto, kmAtual, hoje))
    .sort((a, b) => {
      const fa = a.fracaoRestante ?? Number.POSITIVE_INFINITY
      const fb = b.fracaoRestante ?? Number.POSITIVE_INFINITY
      if (fa !== fb) return fa - fb

      // Moto recém-cadastrada deixa todo mundo empatado em 100%. Aí o que
      // vale é quem chega antes de verdade: prazo primeiro, depois km, e
      // por último o nome — para a lista nunca sair em ordem de uuid.
      const diasA = a.diasRestante ?? Number.POSITIVE_INFINITY
      const diasB = b.diasRestante ?? Number.POSITIVE_INFINITY
      if (diasA !== diasB) return diasA - diasB

      const kmA = a.kmRestante ?? Number.POSITIVE_INFINITY
      const kmB = b.kmRestante ?? Number.POSITIVE_INFINITY
      if (kmA !== kmB) return kmA - kmB

      return a.item.nome.localeCompare(b.item.nome, 'pt-BR')
    })
}

// --------------------------------------------------------------- consumo

export interface Consumo {
  kmPorLitro: number | null
  /** Quantos trechos tanque-cheio → tanque-cheio entraram na conta. */
  trechos: number
  kmRodados: number
  litros: number
}

/**
 * Só o método tanque cheio → tanque cheio dá consumo confiável:
 * a distância entre dois enchimentos foi feita exatamente com os
 * litros do segundo. Abastecimento parcial é ignorado.
 */
export function calcularConsumo(abastecimentos: Abastecimento[]): Consumo {
  const cheios = abastecimentos
    .filter((a) => a.tanque_cheio && a.km !== null && a.km > 0 && a.litros !== null && a.litros > 0)
    .sort((a, b) => (a.km as number) - (b.km as number))

  let kmRodados = 0
  let litros = 0
  let trechos = 0

  for (let i = 1; i < cheios.length; i++) {
    const anterior = cheios[i - 1]
    const atual = cheios[i]
    const distancia = (atual.km as number) - (anterior.km as number)
    if (distancia <= 0) continue
    kmRodados += distancia
    litros += atual.litros as number
    trechos++
  }

  return {
    kmPorLitro: trechos > 0 && litros > 0 ? Number((kmRodados / litros).toFixed(2)) : null,
    trechos,
    kmRodados,
    litros: Number(litros.toFixed(2)),
  }
}

// ----------------------------------------------------------------- custos

export interface ResumoCustos {
  combustivel: number
  manutencao: number
  outras: number
  total: number
  kmRodados: number
  custoPorKm: number | null
}

function dentro(data: string, de: string | null, ate: string | null): boolean {
  if (de && data < de) return false
  if (ate && data > ate) return false
  return true
}

export function resumirCustos(
  servicos: Servico[],
  abastecimentos: Abastecimento[],
  despesas: Despesa[],
  leituras: LeituraOdometro[],
  de: string | null,
  ate: string | null,
): ResumoCustos {
  const manutencao = servicos
    .filter((s) => dentro(s.data, de, ate))
    .reduce((t, s) => t + (s.valor ?? 0), 0)

  const combustivel = abastecimentos
    .filter((a) => dentro(a.data, de, ate))
    .reduce((t, a) => t + (a.valor_total ?? 0), 0)

  const outras = despesas
    .filter((d) => dentro(d.data, de, ate))
    .reduce((t, d) => t + (d.valor ?? 0), 0)

  const noPeriodo = ordenar(leituras.filter((l) => dentro(l.data, de, ate)))
  const kmRodados =
    noPeriodo.length >= 2 ? Math.max(0, noPeriodo[noPeriodo.length - 1].km - noPeriodo[0].km) : 0

  const total = manutencao + combustivel + outras

  return {
    combustivel,
    manutencao,
    outras,
    total,
    kmRodados,
    custoPorKm: kmRodados > 0 ? Number((total / kmRodados).toFixed(2)) : null,
  }
}

export function descreverUltimoServico(v: Vencimento): string {
  if (!v.ultimoServico) return 'sem histórico ainda'
  const s = v.ultimoServico
  const km = s.km !== null ? ` · ${formatarKm(s.km)}` : ''
  return `último em ${formatarData(s.data)}${km}`
}
