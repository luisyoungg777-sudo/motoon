import { HONDA } from './honda'
import { YAMAHA } from './yamaha'
import { SHINERAY } from './shineray'
import { SUZUKI } from './suzuki'
import { KAWASAKI } from './kawasaki'
import { DAFRA } from './dafra'
import { HAOJUE } from './haojue'
import { TRIUMPH } from './triumph'
import { HARLEY_DAVIDSON } from './harley-davidson'
import type { ModeloMoto } from '@/types'

/**
 * Agregador do catálogo. Para somar uma marca, crie o arquivo dela ao lado
 * (kawasaki.ts, suzuki.ts, bmw.ts…) e acrescente uma linha aqui. Nenhum
 * componente deve importar arquivo de marca diretamente — quem consulta o
 * catálogo usa src/services/catalogoMotos.ts.
 *
 * Sobre imagens: `imagemUrl` fica vazio de propósito. Ver README, seção
 * "Imagens do catálogo" — a foto do próprio usuário é a protagonista, e o
 * placeholder cobre o resto. Nada de hotlink em imagem de fabricante.
 */
export const MOTOS_BR: ModeloMoto[] = [
  ...HONDA,
  ...YAMAHA,
  ...SHINERAY,
  ...SUZUKI,
  ...KAWASAKI,
  ...DAFRA,
  ...HAOJUE,
  ...TRIUMPH,
  ...HARLEY_DAVIDSON,
]

export const MARCAS_BR: string[] = Array.from(new Set(MOTOS_BR.map((m) => m.marca))).sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
)
