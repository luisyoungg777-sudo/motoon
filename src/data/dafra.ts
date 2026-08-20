import type { ModeloMoto } from '@/types'

/**
 * Catálogo Dafra — mercado brasileiro.
 *
 * Fonte: https://daframotos.com.br/ — lida em 20/08/2026. O agrupamento
 * abaixo (scooters de um lado, motocicletas de outro) é o do próprio site.
 *
 * Sobre a `categoria`: o nome do modelo e o grupo vêm da fonte oficial; a
 * distinção entre `naked` e `trail` dentro das motocicletas é classificação
 * nossa, porque o site não a faz.
 */

const CATALOGO = 'https://daframotos.com.br/'

function dafra(
  id: string,
  modelo: string,
  categoria: ModeloMoto['categoria'],
): ModeloMoto {
  return {
    id: `dafra-${id}`,
    marca: 'Dafra',
    modelo,
    categoria,
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  }
}

export const DAFRA: ModeloMoto[] = [
  // --------------------------------------------------------------- scooters
  dafra('adxtg-150', 'ADXTG 150', 'scooter'),
  dafra('adxtg-300', 'ADXTG 300', 'scooter'),
  dafra('cruisym-150', 'Cruisym 150', 'scooter'),
  dafra('cruisym-300', 'Cruisym 300', 'scooter'),
  dafra('joyride-300', 'Joyride 300', 'scooter'),
  dafra('maxsym-400-gt', 'Maxsym 400 GT', 'scooter'),

  // ----------------------------------------------------------- motocicletas
  dafra('nh-190', 'NH 190', 'naked'),
  dafra('nh-300', 'NH 300', 'naked'),
  dafra('nhx-190', 'NHX 190', 'trail'),
]
