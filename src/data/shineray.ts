import type { ModeloMoto } from '@/types'

/**
 * Catálogo Shineray — mercado brasileiro.
 *
 * Fonte: https://www.shineray.com.br/
 * Esta é a única das três marcas cuja página respondeu à leitura
 * automatizada. A lista abaixo é exatamente a que o site oficial exibe,
 * incluindo o agrupamento dele: ciclomotores, motocicletas, elétricas e
 * scooters. Todos os modelos são `procedencia: 'oficial'`.
 */

const CATALOGO = 'https://www.shineray.com.br/'

function shineray(
  id: string,
  modelo: string,
  categoria: ModeloMoto['categoria'],
): ModeloMoto {
  return {
    id: `shineray-${id}`,
    marca: 'Shineray',
    modelo,
    categoria,
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  }
}

export const SHINERAY: ModeloMoto[] = [
  // ------------------------------------------------------ ciclomotores
  shineray('jet-50', 'Jet 50', 'ciclomotor'),
  shineray('phoenix-s', 'Phoenix S', 'ciclomotor'),
  shineray('phoenix-s-efi', 'Phoenix S EFI', 'ciclomotor'),

  // ------------------------------------------------------ motocicletas
  shineray('rio-125-efi', 'Rio 125 EFI', 'street'),
  shineray('jet-125', 'Jet 125', 'street'),
  shineray('jet-125-efi', 'Jet 125 EFI', 'street'),
  shineray('free-150-efi', 'Free 150 EFI', 'street'),
  shineray('jef-150', 'JEF 150', 'trail'),
  shineray('jef-150s-efi', 'JEF 150s EFI', 'trail'),
  shineray('jef-170', 'JEF 170', 'trail'),
  shineray('urban-lite', 'Urban Lite', 'street'),
  shineray('urban-150-efi', 'Urban 150 EFI', 'street'),
  shineray('shi-170', 'SHI 170', 'street'),
  shineray('shi-175', 'SHI 175', 'street'),
  shineray('shi-175s-efi', 'SHI 175s EFI', 'street'),
  shineray('shi-250', 'SHI 250', 'street'),
  shineray('250f', '250F', 'trail'),

  // ---------------------------------------------------------- elétricas
  shineray('se1', 'SE1', 'eletrica'),
  shineray('se2', 'SE2', 'eletrica'),
  shineray('she-s', 'SHE-S', 'eletrica'),

  // ----------------------------------------------------------- scooters
  shineray('pt1s', 'PT1s', 'scooter'),
  shineray('pt2xs', 'PT2XS', 'scooter'),
  shineray('pt3s', 'PT3S', 'scooter'),
  shineray('ptxr', 'PTXR', 'scooter'),
]
