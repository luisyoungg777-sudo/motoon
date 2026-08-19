import type { CategoriaDespesa, Confianca, TipoCombustivel, TipoLancamento } from '@/types'

/**
 * Dicionário do parser de frase curta.
 *
 * Regras para mexer aqui:
 *  - `termos` sempre em minúsculo e SEM acento (o parser normaliza a frase
 *    antes de comparar, então 'óleo' digitado casa com o termo 'oleo').
 *  - O termo mais longo que casar é o que vence. Por isso 'oleo de freio'
 *    ganha de 'oleo' sem precisar de nenhuma ordem especial na lista.
 *  - `item` tem que ser exatamente o `nome` de um item do CATALOGO_PADRAO.
 *  - Inclua as variações e os erros de digitação que o pessoal escreve mesmo.
 */
export interface EntradaDicionario {
  termos: string[]
  tipo: TipoLancamento
  item?: string
  categoriaDespesa?: CategoriaDespesa
  tipoCombustivel?: TipoCombustivel
  confianca?: Confianca
}

export const DICIONARIO: EntradaDicionario[] = [
  // ---------------------------------------------------- abastecimento
  {
    termos: [
      'gasolina',
      'gasosa',
      'gaso',
      'combustivel',
      'abasteci',
      'abastecimento',
      'abastecer',
      'botei gasolina',
      'coloquei gasolina',
      'posto',
      'tanque',
    ],
    tipo: 'abastecimento',
    tipoCombustivel: 'gasolina',
  },
  {
    termos: ['gasolina aditivada', 'aditivada', 'aditivado', 'podium', 'premium'],
    tipo: 'abastecimento',
    tipoCombustivel: 'gasolina_aditivada',
  },
  {
    termos: ['alcool', 'etanol', 'alcol'],
    tipo: 'abastecimento',
    tipoCombustivel: 'etanol',
  },

  // ---------------------------------------------------------- serviço
  {
    // Sem verbo aqui de propósito: 'troquei o oleo' (14 letras) venceria
    // 'oleo de freio' (13) na regra do termo mais longo e mandaria o
    // lançamento para o item errado. 'oleo' sozinho já cobre a frase.
    termos: ['oleo do motor', 'oleo motor', 'oleo', 'olio'],
    tipo: 'servico',
    item: 'Óleo do motor',
  },
  {
    termos: ['filtro de oleo', 'filtro do oleo', 'filtro oleo'],
    tipo: 'servico',
    item: 'Filtro de óleo',
  },
  {
    termos: ['filtro de ar', 'filtro do ar', 'filtro ar'],
    tipo: 'servico',
    item: 'Filtro de ar',
  },
  {
    termos: ['vela de ignicao', 'vela', 'velas'],
    tipo: 'servico',
    item: 'Vela de ignição',
  },
  {
    termos: [
      'folga de valvulas',
      'folga das valvulas',
      'regulagem de valvulas',
      'regulei as valvulas',
      'valvula',
      'valvulas',
    ],
    tipo: 'servico',
    item: 'Folga de válvulas',
  },
  {
    termos: [
      'lubrificacao da corrente',
      'lubrifiquei a corrente',
      'lubrifiquei corrente',
      'lubrificar corrente',
      'lubrifiquei',
      'engraxei a corrente',
      'passei graxa na corrente',
      'spray na corrente',
      'graxa na corrente',
      'lubrifiquei a relacao',
    ],
    tipo: 'servico',
    item: 'Lubrificação da corrente',
  },
  {
    termos: [
      'regulagem da corrente',
      'regulei a corrente',
      'ajustei a corrente',
      'estiquei a corrente',
      'esticar a corrente',
      'tensionei a corrente',
    ],
    tipo: 'servico',
    item: 'Regulagem da corrente',
  },
  {
    termos: [
      'kit relacao',
      'kit de relacao',
      'kit tracao',
      'relacao',
      'relaçao',
      'coroa e pinhao',
      'coroa',
      'pinhao',
      'corrente nova',
      'troquei a corrente',
    ],
    tipo: 'servico',
    item: 'Kit relação (corrente, coroa, pinhão)',
  },
  {
    termos: ['fluido de freio', 'oleo de freio', 'oleo do freio', 'fluido freio', 'dot 4', 'dot4'],
    tipo: 'servico',
    item: 'Óleo/fluido de freio',
  },
  {
    termos: [
      'pastilha de freio',
      'pastilhas de freio',
      'pastilha',
      'pastilhas',
      'lona de freio',
      'lonas de freio',
      'lona',
      'freio',
      'freios',
    ],
    tipo: 'servico',
    item: 'Pastilhas de freio',
  },
  {
    termos: ['pneu dianteiro', 'pneu da frente', 'pneu de frente'],
    tipo: 'servico',
    item: 'Pneu dianteiro',
  },
  {
    termos: ['pneu traseiro', 'pneu de tras', 'pneu tras', 'pneu traz'],
    tipo: 'servico',
    item: 'Pneu traseiro',
  },
  {
    termos: [
      'calibragem dos pneus',
      'calibragem',
      'calibrei os pneus',
      'calibrei o pneu',
      'calibrei',
      'calibrar pneu',
      'pressao dos pneus',
    ],
    tipo: 'servico',
    item: 'Calibragem dos pneus',
  },
  {
    termos: ['bateria', 'bateria nova', 'testei a bateria', 'carreguei a bateria'],
    tipo: 'servico',
    item: 'Bateria (teste de carga)',
  },
  {
    termos: ['oleo do garfo', 'oleo de garfo', 'garfo', 'bengala', 'suspensao', 'amortecedor'],
    tipo: 'servico',
    item: 'Óleo do garfo (suspensão)',
  },
  {
    termos: ['revisao geral', 'revisao', 'revisei', 'revisao completa'],
    tipo: 'servico',
    item: 'Revisão geral',
  },
  // Sem qualificador, 'corrente' quase sempre é lubrificação — mas cai como
  // média confiança para o usuário conferir no cartão antes de salvar.
  {
    termos: ['corrente'],
    tipo: 'servico',
    item: 'Lubrificação da corrente',
    confianca: 'media',
  },
  // Serviço genérico: entende que é serviço, mas não sabe qual item.
  {
    termos: ['mecanico', 'oficina', 'mao de obra', 'consertei', 'conserto', 'servico'],
    tipo: 'servico',
  },

  // ---------------------------------------------------------- despesa
  {
    termos: ['pedagio', 'pedagios', 'praca de pedagio', 'sem parar'],
    tipo: 'despesa',
    categoriaDespesa: 'pedagio',
  },
  {
    termos: ['lavagem', 'lavei a moto', 'lavei', 'lava jato', 'lavajato', 'lava rapido'],
    tipo: 'despesa',
    categoriaDespesa: 'lavagem',
  },
  {
    termos: ['seguro', 'seguro da moto', 'apolice'],
    tipo: 'despesa',
    categoriaDespesa: 'seguro',
  },
  { termos: ['ipva'], tipo: 'despesa', categoriaDespesa: 'ipva' },
  {
    termos: ['licenciamento', 'licenciei', 'dpvat', 'crlv', 'emplacamento'],
    tipo: 'despesa',
    categoriaDespesa: 'licenciamento',
  },
  {
    termos: ['multa', 'multas', 'infracao'],
    tipo: 'despesa',
    categoriaDespesa: 'multa',
  },
  {
    termos: ['estacionamento', 'estacionei', 'ficha', 'zona azul'],
    tipo: 'despesa',
    categoriaDespesa: 'estacionamento',
  },
  {
    termos: [
      'capacete',
      'viseira',
      'luva',
      'luvas',
      'jaqueta',
      'bota',
      'capa de chuva',
      'bau',
      'bag',
      'mochila',
    ],
    tipo: 'despesa',
    categoriaDespesa: 'equipamento',
  },
  {
    termos: ['financiamento', 'parcela da moto', 'prestacao', 'parcela'],
    tipo: 'despesa',
    categoriaDespesa: 'financiamento',
  },
]

/** Termos que só ajustam um campo, sem definir o tipo do lançamento. */
export const TERMOS_TANQUE_CHEIO = [
  'tanque cheio',
  'enchi o tanque',
  'enchi',
  'completei o tanque',
  'completei',
  'cheio',
]

export const TERMOS_COMBUSTIVEL: { termos: string[]; valor: TipoCombustivel }[] = [
  { termos: ['gasolina aditivada', 'aditivada', 'aditivado', 'podium', 'premium'], valor: 'gasolina_aditivada' },
  { termos: ['alcool', 'etanol', 'alcol'], valor: 'etanol' },
  { termos: ['gasolina', 'gasosa', 'gaso', 'comum'], valor: 'gasolina' },
]
