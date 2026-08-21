import type { ModeloMoto } from '@/types'

/**
 * Catálogo Harley-Davidson — mercado brasileiro.
 *
 * Fonte: https://www.harley-davidson.com/br/pt/motorcycles/index.html — lida
 * em 20/08/2026, linha 2026. O agrupamento abaixo é o do próprio site.
 *
 * Os nomes vão sem o símbolo de marca registrada que o site aplica
 * ("Street Bob™"): ele é marcação de página, não parte do nome, e atrapalha a
 * busca por texto.
 *
 * Sobre a `categoria`: o app não tem "cruiser", que é o segmento de mais da
 * metade desta lista. A tradução segue o agrupamento oficial — Cruiser vira
 * `street`, Grand American Touring vira `touring`, Adventure Touring vira
 * `adventure` —, e é a mesma escolha já feita para a Kawasaki Eliminator 500.
 * Se um dia entrar `custom` na taxonomia, é aqui que ela mais faz falta.
 */

const CATALOGO = 'https://www.harley-davidson.com/br/pt/motorcycles/index.html'

function harley(
  id: string,
  modelo: string,
  categoria: ModeloMoto['categoria'],
  nomeCurto?: string,
): ModeloMoto {
  return {
    id: `harley-${id}`,
    marca: 'Harley-Davidson',
    modelo,
    ...(nomeCurto ? { nomeCurto } : {}),
    categoria,
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  }
}

export const HARLEY_DAVIDSON: ModeloMoto[] = [
  // ------------------------------------------------------------- Cruiser
  harley('street-bob', 'Street Bob', 'street'),
  harley('low-rider-s', 'Low Rider S', 'street'),
  harley('low-rider-st', 'Low Rider ST', 'street'),
  harley('breakout', 'Breakout', 'street'),
  harley('fat-boy', 'Fat Boy', 'street'),
  harley('heritage-classic', 'Heritage Classic', 'street'),

  // ----------------------------------------------- Grand American Touring
  harley('street-glide', 'Street Glide', 'touring'),
  harley('road-glide', 'Road Glide', 'touring'),
  harley('street-glide-limited', 'Street Glide Limited', 'touring'),
  harley('road-glide-limited', 'Road Glide Limited', 'touring'),
  harley('cvo-road-glide-st', 'CVO Road Glide ST', 'touring', 'CVO Road Glide'),
  harley(
    'cvo-street-glide-limited',
    'CVO Street Glide Limited',
    'touring',
    'CVO Street Glide',
  ),

  // --------------------------------------------------------------- Sport
  harley('sportster-s', 'Sportster S', 'naked'),

  // ---------------------------------------------------- Adventure Touring
  harley('pan-america-1250-special', 'Pan America 1250 Special', 'adventure', 'Pan America 1250'),
]
