import type { ModeloMoto } from '@/types'

/**
 * Catálogo Triumph — mercado brasileiro.
 *
 * Fonte: https://www.triumphmotorcycles.com.br/motocicletas — lida em
 * 20/08/2026. A página inicial só lista as FAMÍLIAS (Adventure, Classic,
 * Roadsters, Rocket 3, Sport); os modelos vieram de cada página de família.
 *
 * A família Sport não listou modelo nenhum na leitura, então ela não aparece
 * aqui. Preferir a lacuna a preencher de memória: `procedencia: 'oficial'`
 * afirma que o modelo foi conferido na fonte, e vale só enquanto for verdade.
 *
 * Sobre a `categoria`: a Triumph organiza por família, que é outro eixo. A
 * tradução para a taxonomia do app é nossa — e ela não tem "classic" nem
 * "cruiser", então a Bonneville e as Rocket caem no que mais se aproxima.
 */

const CATALOGO = 'https://www.triumphmotorcycles.com.br/motocicletas'

function triumph(
  id: string,
  modelo: string,
  categoria: ModeloMoto['categoria'],
  nomeCurto?: string,
): ModeloMoto {
  return {
    id: `triumph-${id}`,
    marca: 'Triumph',
    modelo,
    ...(nomeCurto ? { nomeCurto } : {}),
    categoria,
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  }
}

export const TRIUMPH: ModeloMoto[] = [
  // ---------------------------------------------------------- Adventure
  triumph('tiger-sport-660', 'Tiger Sport 660', 'adventure'),
  triumph('tiger-sport-800', 'Tiger Sport 800', 'adventure'),
  triumph('tiger-1200', 'Tiger 1200', 'adventure'),

  // ---------------------------------------------------------- Roadsters
  triumph('trident-660', 'Trident 660', 'naked'),
  triumph('street-triple-765', 'Street Triple 765', 'naked'),

  // ----------------------------------------------------- Modern Classics
  triumph('tracker-400', 'Tracker 400', 'naked'),
  triumph('bonneville-t100', 'Bonneville T100', 'naked'),
  triumph('scrambler-1200-xe', 'Scrambler 1200 XE', 'trail'),

  // ------------------------------------------------------------ Rocket 3
  triumph('rocket-3-storm-r', 'Rocket 3 Storm R', 'naked'),
  triumph('rocket-3-storm-gt', 'Rocket 3 Storm GT', 'touring'),
]
