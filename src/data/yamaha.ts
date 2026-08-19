import type { ModeloMoto } from '@/types'

/**
 * Catálogo Yamaha — mercado brasileiro.
 *
 * Fonte: https://www.yamaha-motor.com.br/motos
 * A página bloqueia leitura automatizada (HTTP 403). A lista veio das
 * listagens de produto indexadas do próprio domínio yamaha-motor.com.br,
 * que trazem os nomes comerciais completos da linha 2026 — por isso vários
 * modelos carregam os sufixos ABS e Connected como a Yamaha os vende.
 */

const CATALOGO = 'https://www.yamaha-motor.com.br/motos'

export const YAMAHA: ModeloMoto[] = [
  // ----------------------------------------------------------- street
  {
    id: 'yamaha-factor',
    marca: 'Yamaha',
    modelo: 'Factor',
    categoria: 'street',
    fonteUrl: 'https://www.yamaha-motor.com.br/noticia/163/yamaha-factor-chega-a-linha-2026',
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-factor-dx',
    marca: 'Yamaha',
    modelo: 'Factor DX',
    categoria: 'street',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-fazer-fz15-abs-connected',
    marca: 'Yamaha',
    modelo: 'Fazer FZ15 ABS Connected',
    categoria: 'street',
    fonteUrl:
      'https://www.yamaha-motor.com.br/receber-contato/product/fazer-fz15-abs-connected-2026-151299',
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-fazer-fz25-abs-connected',
    marca: 'Yamaha',
    modelo: 'Fazer FZ25 ABS Connected',
    categoria: 'street',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },

  // ---------------------------------------------------------- scooter
  {
    id: 'yamaha-fluo-abs-hybrid-connected',
    marca: 'Yamaha',
    modelo: 'Fluo ABS Hybrid Connected',
    categoria: 'scooter',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-neo',
    marca: 'Yamaha',
    modelo: 'Neo 125',
    categoria: 'scooter',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'linha-conhecida',
    revisar: true,
    ativa: true,
  },
  {
    id: 'yamaha-aerox-abs-connected',
    marca: 'Yamaha',
    modelo: 'Aerox ABS Connected',
    categoria: 'scooter',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-nmax-abs-connected',
    marca: 'Yamaha',
    modelo: 'NMAX ABS Connected',
    categoria: 'scooter',
    fonteUrl: 'https://www.yamaha-motor.com.br/product/nova-nmax-abs-connected-151482',
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-xmax-300-connected',
    marca: 'Yamaha',
    modelo: 'XMAX 300 Connected',
    categoria: 'scooter',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },

  // ------------------------------------------------------------ trail
  {
    id: 'yamaha-crosser-150-s-abs',
    marca: 'Yamaha',
    modelo: 'Crosser 150 S ABS',
    categoria: 'trail',
    fonteUrl: 'https://www.yamaha-motor.com.br/crossers',
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-crosser-150-z-abs',
    marca: 'Yamaha',
    modelo: 'Crosser 150 Z ABS',
    categoria: 'trail',
    fonteUrl: 'https://www.yamaha-motor.com.br/crossers',
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-lander-connected',
    marca: 'Yamaha',
    modelo: 'Lander Connected',
    categoria: 'trail',
    fonteUrl: 'https://www.yamaha-motor.com.br/lander-connected/product/30167',
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },

  // -------------------------------------------------------- adventure
  {
    id: 'yamaha-tenere-700',
    marca: 'Yamaha',
    modelo: 'Ténéré 700',
    categoria: 'adventure',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },

  // -------------------------------------------------------- esportiva
  {
    id: 'yamaha-r15-abs',
    marca: 'Yamaha',
    modelo: 'R15 ABS',
    categoria: 'esportiva',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-r15-abs-70th',
    marca: 'Yamaha',
    modelo: 'R15 ABS 70TH',
    categoria: 'esportiva',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-r3-abs-connected',
    marca: 'Yamaha',
    modelo: 'R3 ABS Connected',
    categoria: 'esportiva',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-r3-abs-connected-70th',
    marca: 'Yamaha',
    modelo: 'R3 ABS Connected 70TH',
    categoria: 'esportiva',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },

  // ------------------------------------------------------------ naked
  {
    id: 'yamaha-mt-03-connected',
    marca: 'Yamaha',
    modelo: 'MT-03 Connected',
    categoria: 'naked',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-mt-07-connected',
    marca: 'Yamaha',
    modelo: 'MT-07 Connected',
    categoria: 'naked',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'oficial',
    ativa: true,
  },
  {
    id: 'yamaha-mt-09',
    marca: 'Yamaha',
    modelo: 'MT-09',
    categoria: 'naked',
    fonteUrl: CATALOGO,
    fonteTipo: 'fabricante',
    procedencia: 'linha-conhecida',
    revisar: true,
    ativa: true,
  },
]
