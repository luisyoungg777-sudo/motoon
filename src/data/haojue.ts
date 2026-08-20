import type { ModeloMoto } from '@/types'

/**
 * Catálogo Haojue — mercado brasileiro.
 *
 * Fonte: https://haojuemotos.com.br/ — lida em 20/08/2026. É o site da JTZ
 * Motos, que representa a marca no Brasil.
 *
 * Cuidado ao atualizar: `haojue.com.br`, sem o "motos", devolve página de
 * concessionária, não o catálogo do representante. Os dois endereços se
 * parecem e mostram listas diferentes.
 *
 * A Burgman 125 aparece aqui, e não na Suzuki, porque é a Haojue que a vende
 * no Brasil — o nome é da Suzuki, a distribuição é da Haojue. Se algum dia a
 * Suzuki passar a listá-la também, cuidado com o id repetido.
 *
 * Sobre a `categoria`: o nome do modelo e a presença na linha brasileira vêm
 * da fonte oficial; a categoria é classificação nossa.
 */

const CATALOGO = 'https://haojuemotos.com.br/'

function haojue(
  id: string,
  modelo: string,
  categoria: ModeloMoto['categoria'],
): ModeloMoto {
  return {
    id: `haojue-${id}`,
    marca: 'Haojue',
    modelo,
    categoria,
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  }
}

export const HAOJUE: ModeloMoto[] = [
  haojue('master-ride-150', 'Master Ride 150', 'street'),
  haojue('dk160', 'DK160', 'street'),
  haojue('nk160', 'NK160', 'naked'),
  haojue('dr160', 'DR160', 'trail'),
  haojue('dl160', 'DL160', 'adventure'),
  haojue('burgman-125', 'Burgman 125', 'scooter'),
]
