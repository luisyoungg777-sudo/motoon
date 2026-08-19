import { MARCAS_BR, MOTOS_BR } from '@/data/motos-br'
import { normalizar } from './formato'
import type { CategoriaMoto, ModeloMoto } from '@/types'

export interface FiltroCatalogo {
  texto?: string
  marca?: string | null
  categoria?: CategoriaMoto | null
  limite?: number
}

const ativos = (): ModeloMoto[] => MOTOS_BR.filter((m) => m.ativa)

export function listarMarcas(): string[] {
  return MARCAS_BR
}

export function obterModelo(id: string): ModeloMoto | null {
  return MOTOS_BR.find((m) => m.id === id) ?? null
}

export function listarCategorias(): CategoriaMoto[] {
  const usadas = new Set(ativos().map((m) => m.categoria))
  return Array.from(usadas)
}

/**
 * Pontua o quanto um modelo responde a UM termo digitado.
 * Zero significa que o termo não aparece — e aí o modelo é descartado,
 * porque a busca exige todos os termos ("honda titan" tem que casar os dois).
 */
function pontuarTermo(modelo: ModeloMoto, termo: string): number {
  const nome = normalizar(modelo.modelo)
  const marca = normalizar(modelo.marca)
  const palavras = nome.split(/[^a-z0-9]+/).filter(Boolean)

  if (nome === termo) return 1000
  if (nome.startsWith(termo)) return 300
  if (palavras.some((p) => p === termo)) return 220
  if (palavras.some((p) => p.startsWith(termo))) return 160
  if (nome.includes(termo)) return 90

  if (marca === termo) return 70
  if (marca.startsWith(termo)) return 55
  if (marca.includes(termo)) return 35

  if (normalizar(modelo.categoria).includes(termo)) return 15

  return 0
}

function pontuar(modelo: ModeloMoto, termos: string[]): number {
  let total = 0
  for (const termo of termos) {
    const p = pontuarTermo(modelo, termo)
    if (p === 0) return 0
    total += p
  }
  // Entre dois modelos que casaram igual, o nome mais curto é o mais
  // específico: 'CG 160 Fan' antes de 'CG 160 Fan Special Edition'.
  return total - modelo.modelo.length * 0.1
}

/**
 * Busca por relevância. Aceita 'cg', 'titan', 'honda titan' e '160 titan'
 * porque quebra a consulta em termos e exige que todos apareçam em algum
 * lugar — marca, modelo ou categoria.
 */
export function buscarModelos(filtro: FiltroCatalogo | string): ModeloMoto[] {
  const f: FiltroCatalogo = typeof filtro === 'string' ? { texto: filtro } : filtro
  const limite = f.limite ?? 20

  let lista = ativos()

  if (f.marca) {
    const alvo = normalizar(f.marca)
    lista = lista.filter((m) => normalizar(m.marca) === alvo)
  }

  if (f.categoria) {
    lista = lista.filter((m) => m.categoria === f.categoria)
  }

  const termos = normalizar(f.texto ?? '')
    .split(/\s+/)
    .filter(Boolean)

  if (termos.length === 0) {
    return [...lista]
      .sort(
        (a, b) =>
          a.marca.localeCompare(b.marca, 'pt-BR') || a.modelo.localeCompare(b.modelo, 'pt-BR'),
      )
      .slice(0, limite)
  }

  return lista
    .map((modelo) => ({ modelo, pontos: pontuar(modelo, termos) }))
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || a.modelo.modelo.localeCompare(b.modelo.modelo, 'pt-BR'))
    .slice(0, limite)
    .map((r) => r.modelo)
}

/** Texto do placeholder quando não há imagem — nunca um card vazio. */
export function rotuloPlaceholder(modelo: Pick<ModeloMoto, 'marca' | 'modelo'>): {
  marca: string
  modelo: string
} {
  return { marca: modelo.marca.toUpperCase(), modelo: modelo.modelo.toUpperCase() }
}

/** Quantos modelos ainda dependem de conferência humana. */
export function contarParaRevisar(): number {
  return MOTOS_BR.filter((m) => m.revisar).length
}
