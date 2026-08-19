import { DICIONARIO, TERMOS_COMBUSTIVEL, TERMOS_TANQUE_CHEIO, type EntradaDicionario } from '@/data/dicionario'
import { hojeISO, paraISO, somarDias } from './datas'
import { normalizar } from './formato'
import type { CategoriaDespesa, Confianca, TipoCombustivel, TipoLancamento } from '@/types'

export type CampoFaltando = 'tipo' | 'item' | 'categoria' | 'valor' | 'km' | 'litros'

export interface Lancamento {
  textoOriginal: string
  tipo: TipoLancamento | null
  data: string
  valor: number | null
  km: number | null
  litros: number | null
  itemNome: string | null
  categoriaDespesa: CategoriaDespesa | null
  tipoCombustivel: TipoCombustivel | null
  tanqueCheio: boolean
  descricao: string
  confianca: Confianca
  camposFaltando: CampoFaltando[]
  /** Números que sobraram sem destino — o cartão avisa em vez de chutar. */
  numerosIgnorados: number[]
}

export interface OpcoesParser {
  /** Data de referência (aaaa-mm-dd). Injetável para os testes. */
  hoje?: string
}

// ------------------------------------------------------------- dicionário

interface TermoIndexado {
  termo: string
  entrada: EntradaDicionario
}

const TERMOS: TermoIndexado[] = DICIONARIO.flatMap((entrada) =>
  entrada.termos.map((t) => ({ termo: normalizar(t), entrada })),
).sort((a, b) => b.termo.length - a.termo.length)

function ehAlfaNum(c: string | undefined): boolean {
  return c !== undefined && /[a-z0-9]/.test(c)
}

/** Substring com fronteira de palavra — evita 'lona' casar dentro de 'lonaria'. */
function contemTermo(texto: string, termo: string): boolean {
  let i = texto.indexOf(termo)
  while (i !== -1) {
    const antes = i > 0 ? texto[i - 1] : undefined
    const depois = texto[i + termo.length]
    if (!ehAlfaNum(antes) && !ehAlfaNum(depois)) return true
    i = texto.indexOf(termo, i + 1)
  }
  return false
}

function distancia(a: string, b: string): number {
  const linha = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0]
    linha[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = linha[j]
      linha[j] = Math.min(
        linha[j] + 1,
        linha[j - 1] + 1,
        anterior + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      anterior = temp
    }
  }
  return linha[b.length]
}

function toleranciaTipo(termo: string): number {
  if (termo.length >= 8) return 2
  if (termo.length >= 5) return 1
  return 0
}

interface Achado {
  entrada: EntradaDicionario
  exato: boolean
}

function acharEntrada(texto: string): Achado | null {
  for (const { termo, entrada } of TERMOS) {
    if (contemTermo(texto, termo)) return { entrada, exato: true }
  }

  // Nada exato: tenta erro de digitação, palavra por palavra.
  const palavras = texto.split(/[^a-z0-9]+/).filter((p) => p.length >= 4)
  let melhor: { entrada: EntradaDicionario; dist: number } | null = null

  for (const { termo, entrada } of TERMOS) {
    if (termo.includes(' ')) continue
    const tol = toleranciaTipo(termo)
    if (tol === 0) continue
    for (const palavra of palavras) {
      if (Math.abs(palavra.length - termo.length) > tol) continue
      const d = distancia(palavra, termo)
      if (d <= tol && (melhor === null || d < melhor.dist)) melhor = { entrada, dist: d }
    }
  }

  return melhor ? { entrada: melhor.entrada, exato: false } : null
}

function acharCombustivel(texto: string): TipoCombustivel | null {
  for (const { termos, valor } of TERMOS_COMBUSTIVEL) {
    for (const t of termos) {
      if (contemTermo(texto, normalizar(t))) return valor
    }
  }
  return null
}

function temTanqueCheio(texto: string): boolean {
  return TERMOS_TANQUE_CHEIO.some((t) => contemTermo(texto, normalizar(t)))
}

// ------------------------------------------------------------------ datas

const RE_DATA_BARRA = /\b(0?[1-9]|[12]\d|3[01])[/-](0?[1-9]|1[0-2])(?:[/-](\d{4}|\d{2}))?\b/
const RE_DIA = /\bdia\s+(0?[1-9]|[12]\d|3[01])\b/

interface DataExtraida {
  data: string
  texto: string
}

function extrairData(texto: string, hoje: string): DataExtraida {
  const relativos: [RegExp, number][] = [
    [/\banteontem\b/, -2],
    [/\bontem\b/, -1],
    [/\bhoje\b/, 0],
    [/\bsemana passada\b/, -7],
  ]
  for (const [re, delta] of relativos) {
    if (re.test(texto)) {
      return { data: somarDias(hoje, delta), texto: texto.replace(re, ' ') }
    }
  }

  const barra = texto.match(RE_DATA_BARRA)
  if (barra) {
    const dia = Number(barra[1])
    const mes = Number(barra[2])
    const anoBruto = barra[3]
    const [anoHoje] = hoje.split('-').map(Number)
    let ano: number
    if (anoBruto === undefined) ano = anoHoje
    else if (anoBruto.length === 2) ano = 2000 + Number(anoBruto)
    else ano = Number(anoBruto)

    let candidata = paraISO(new Date(ano, mes - 1, dia))
    if (anoBruto === undefined && candidata > hoje) {
      candidata = paraISO(new Date(ano - 1, mes - 1, dia))
    }
    return { data: candidata, texto: texto.replace(RE_DATA_BARRA, ' ') }
  }

  const dia = texto.match(RE_DIA)
  if (dia) {
    const d = Number(dia[1])
    const [ano, mes] = hoje.split('-').map(Number)
    let candidata = paraISO(new Date(ano, mes - 1, d))
    if (candidata > hoje) {
      const anterior = new Date(ano, mes - 1, d)
      anterior.setMonth(anterior.getMonth() - 1)
      candidata = paraISO(anterior)
    }
    return { data: candidata, texto: texto.replace(RE_DIA, ' ') }
  }

  return { data: hoje, texto }
}

// ---------------------------------------------------------------- números

type Unidade = 'reais' | 'km' | 'litros' | null

interface TokenNumero {
  n: number
  unidade: Unidade
  /** '12.500' veio com separador de milhar — é inteiro, cara de odômetro. */
  milhar: boolean
}

const RE_NUMERO =
  /(r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,3})?)\s*(reais|real|contos|conto|pila|kms|km|quilometros|quilometro|litros|litro|lts|lt|l)?(?![a-z0-9])/g

function paraNumero(bruto: string): { n: number; milhar: boolean } {
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(bruto)) {
    return { n: Number(bruto.replace(/\./g, '').replace(',', '.')), milhar: true }
  }
  return { n: Number(bruto.replace(',', '.')), milhar: false }
}

function classificarUnidade(u: string | undefined, moeda: string | undefined): Unidade {
  if (moeda) return 'reais'
  if (!u) return null
  if (/^(reais|real|contos|conto|pila)$/.test(u)) return 'reais'
  if (/^(kms|km|quilometros|quilometro)$/.test(u)) return 'km'
  return 'litros'
}

interface NumerosExtraidos {
  tokens: TokenNumero[]
  texto: string
}

function extrairNumeros(texto: string): NumerosExtraidos {
  const tokens: TokenNumero[] = []
  const limpo = texto.replace(RE_NUMERO, (_todo, moeda: string | undefined, num: string, unid: string | undefined) => {
    const { n, milhar } = paraNumero(num)
    if (!Number.isFinite(n)) return ' '
    tokens.push({ n, unidade: classificarUnidade(unid, moeda), milhar })
    return ' '
  })
  return { tokens, texto: limpo }
}

// ----------------------------------------------------------------- parser

const LIMIAR_ODOMETRO = 1000

export function parseFrase(linha: string, opcoes: OpcoesParser = {}): Lancamento {
  const hoje = opcoes.hoje ?? hojeISO()
  const textoOriginal = linha.trim()
  const normalizado = normalizar(textoOriginal)

  const semData = extrairData(normalizado, hoje)
  const { tokens, texto: semNumeros } = extrairNumeros(semData.texto)

  const achado = acharEntrada(semNumeros) ?? acharEntrada(semData.texto)

  const tipo = achado?.entrada.tipo ?? null
  const itemNome = achado?.entrada.item ?? null
  const categoriaDespesa = achado?.entrada.categoriaDespesa ?? null

  let valor: number | null = null
  let km: number | null = null
  let litros: number | null = null
  const sobrando: TokenNumero[] = []

  for (const t of tokens) {
    if (t.unidade === 'km') km ??= Math.round(t.n)
    else if (t.unidade === 'litros') litros ??= t.n
    else if (t.unidade === 'reais') valor ??= t.n
    else sobrando.push(t)
  }

  const numerosIgnorados: number[] = []
  for (const t of sobrando) {
    // Número grande e redondo só faz sentido como odômetro.
    if ((t.milhar || t.n >= LIMIAR_ODOMETRO) && Number.isInteger(t.n)) {
      if (km === null) {
        km = Math.round(t.n)
        continue
      }
    }
    if (valor === null) {
      valor = t.n
      continue
    }
    numerosIgnorados.push(t.n)
  }

  const tipoCombustivel = tipo === 'abastecimento' ? (acharCombustivel(semNumeros) ?? 'gasolina') : null
  const tanqueCheio = tipo === 'abastecimento' ? temTanqueCheio(semNumeros) : false

  const camposFaltando: CampoFaltando[] = []
  if (tipo === null) camposFaltando.push('tipo')
  if (tipo === 'servico' && itemNome === null) camposFaltando.push('item')
  if (tipo === 'despesa' && categoriaDespesa === null) camposFaltando.push('categoria')
  if (tipo !== 'servico' && tipo !== null && valor === null) camposFaltando.push('valor')

  let confianca: Confianca = achado?.entrada.confianca ?? 'alta'
  if (tipo === null) confianca = 'baixa'
  else if (achado && !achado.exato) confianca = 'media'
  else if (numerosIgnorados.length > 0) confianca = 'media'
  else if (camposFaltando.length > 0) confianca = 'media'

  return {
    textoOriginal,
    tipo,
    data: semData.data,
    valor,
    km,
    litros,
    itemNome,
    categoriaDespesa,
    tipoCombustivel,
    tanqueCheio,
    descricao: textoOriginal,
    confianca,
    camposFaltando,
    numerosIgnorados,
  }
}

/**
 * Quebra o texto em lançamentos. Quebra sempre em linha nova e ';'.
 * Também quebra em ' e ' quando os dois lados são reconhecidos sozinhos —
 * é o caso do sujeito que chega em casa e fala tudo de uma vez.
 */
export function dividirEmFrases(texto: string): string[] {
  const brutas = texto
    .split(/[\n;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const finais: string[] = []
  for (const bruta of brutas) {
    finais.push(...quebrarPorE(bruta))
  }
  return finais
}

function quebrarPorE(frase: string): string[] {
  const partes = normalizar(frase).split(/\s+e\s+/)
  if (partes.length < 2) return [frase]

  // Sem número nenhum, o ' e ' quase sempre está ligando pedaços de uma coisa
  // só ('troquei coroa e pinhão'), não dois lançamentos.
  if (!/\d/.test(frase)) return [frase]

  const achados = partes.map((p) => acharEntrada(extrairNumeros(p).texto))
  if (achados.some((a) => a === null)) return [frase]

  // Todos apontando para a mesma entrada também é uma coisa só.
  const primeira = achados[0]?.entrada
  if (achados.every((a) => a?.entrada === primeira)) return [frase]

  // Refaz o corte sobre o texto original para não perder acento e caixa.
  return frase
    .split(/\s+e\s+/i)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function parseTexto(texto: string, opcoes: OpcoesParser = {}): Lancamento[] {
  return dividirEmFrases(texto).map((f) => parseFrase(f, opcoes))
}
