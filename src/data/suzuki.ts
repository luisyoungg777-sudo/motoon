import type { ModeloMoto } from '@/types'

/**
 * Catálogo Suzuki — mercado brasileiro.
 *
 * Fonte: https://www.suzukimotos.com.br/ — a lista de modelos é exatamente a
 * que o site oficial exibe, lida em 20/08/2026.
 *
 * Sobre a `categoria`: o nome do modelo e a presença dele na linha brasileira
 * vêm da fonte oficial, e é isso que `procedencia: 'oficial'` afirma. A
 * categoria é classificação NOSSA — a taxonomia do app não é a mesma do
 * fabricante (a Suzuki agrupa em "Big Trail", "Grand Tourer", "Supreme Sport
 * Crossover"), então traduzir é inevitável.
 *
 * A tabela de preços da Suzuki escreve a versão XT da V-Strom 1050 como
 * "V-STROM 1050/XT", que é abreviação de tabela para duas versões. Aqui elas
 * aparecem separadas, como são vendidas.
 */

const CATALOGO = 'https://www.suzukimotos.com.br/'

function suzuki(
  id: string,
  modelo: string,
  categoria: ModeloMoto['categoria'],
  nomeCurto?: string,
): ModeloMoto {
  return {
    id: `suzuki-${id}`,
    marca: 'Suzuki',
    modelo,
    ...(nomeCurto ? { nomeCurto } : {}),
    categoria,
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  }
}

export const SUZUKI: ModeloMoto[] = [
  // ------------------------------------------------------------- esportivas
  suzuki('hayabusa', 'Hayabusa', 'esportiva'),
  suzuki('gsx-8r', 'GSX-8R', 'esportiva'),

  // ------------------------------------------------------------------ naked
  suzuki('gsx-s1000', 'GSX-S1000', 'naked'),
  suzuki('gsx-8s', 'GSX-8S', 'naked'),

  // ---------------------------------------------------------------- touring
  suzuki('gsx-s1000gx', 'GSX-S1000GX', 'touring'),
  suzuki('gsx-s1000-gt', 'GSX-S1000 GT', 'touring'),

  // -------------------------------------------------- adventure / big trail
  suzuki('v-strom-1050-xt', 'V-Strom 1050 XT', 'adventure'),
  suzuki('v-strom-1050', 'V-Strom 1050', 'adventure'),
  suzuki('v-strom-800-de', 'V-Strom 800 DE', 'adventure'),
  suzuki('v-strom-800', 'V-Strom 800', 'adventure'),
  suzuki('v-strom-650xt', 'V-Strom 650XT', 'adventure'),
]
