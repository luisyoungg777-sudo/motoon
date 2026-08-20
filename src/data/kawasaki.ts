import type { ModeloMoto } from '@/types'

/**
 * Catálogo Kawasaki — mercado brasileiro.
 *
 * Fonte: https://www.kawasakibrasil.com/ — lida em 20/08/2026.
 *
 * Cuidado ao atualizar: `kawasakibrasil.com.br`, com o `.br` no fim, NÃO é
 * mais da marca. O domínio saiu das mãos dela e hoje hospeda outra coisa. O
 * site oficial é o `.com` acima, e buscador ainda devolve o antigo.
 *
 * Sobre a `categoria`: o nome do modelo e a presença dele na linha brasileira
 * vêm da fonte oficial. A categoria é classificação NOSSA — a Kawasaki
 * organiza por família (Ninja, Z, Versys, Vulcan, Eliminator, KLX, KX), que é
 * outro eixo. A Eliminator 500 é custom, categoria que o app não tem; ficou
 * em `street`, que é o guarda-chuva de moto de rua sem carenagem.
 */

const CATALOGO = 'https://www.kawasakibrasil.com/'

function kawasaki(
  id: string,
  modelo: string,
  categoria: ModeloMoto['categoria'],
  nomeCurto?: string,
): ModeloMoto {
  return {
    id: `kawasaki-${id}`,
    marca: 'Kawasaki',
    modelo,
    ...(nomeCurto ? { nomeCurto } : {}),
    categoria,
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  }
}

export const KAWASAKI: ModeloMoto[] = [
  // ------------------------------------------------------------ linha Ninja
  kawasaki('ninja-zx-6r', 'Ninja ZX-6R', 'esportiva'),
  kawasaki('ninja-zx-4rr', 'Ninja ZX-4RR', 'esportiva'),
  kawasaki('ninja-500', 'Ninja 500', 'esportiva'),
  kawasaki('ninja-500-se', 'Ninja 500 SE', 'esportiva'),

  // ---------------------------------------------------------------- linha Z
  kawasaki('z-h2', 'Z H2', 'naked'),
  kawasaki('z1100', 'Z1100', 'naked'),
  kawasaki('z1100-se', 'Z1100 SE', 'naked'),
  kawasaki('z900', 'Z900', 'naked'),
  kawasaki('z650', 'Z650', 'naked'),

  // --------------------------------------------------------------- custom
  kawasaki('eliminator-500', 'Eliminator 500', 'street'),

  // --------------------------------------------------------- linha Versys
  kawasaki(
    'versys-1100-se-grand-tourer',
    'Versys 1100 SE Grand Tourer',
    'touring',
    'Versys 1100 SE',
  ),

  // ------------------------------------------------- linha KX (competição)
  kawasaki('kx250', 'KX250', 'racing'),
  kawasaki('kx112', 'KX112', 'racing'),
]
