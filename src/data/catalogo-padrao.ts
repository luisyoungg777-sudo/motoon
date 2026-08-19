import type { CategoriaItem } from '@/types'

export interface ItemCatalogoPadrao {
  nome: string
  categoria: CategoriaItem
  intervalo_km: number | null
  intervalo_dias: number | null
  observacao: string
}

/**
 * ATENÇÃO — estes números são REFERÊNCIAS GENÉRICAS de uso urbano.
 * Não são o manual de nenhuma moto específica e não devem ser
 * apresentados como se fossem. Todo item criado a partir daqui nasce
 * com fonte 'padrao' e carrega o aviso AVISO_VALOR_GENERICO na tela
 * até o usuário editar o intervalo com o manual dele na mão.
 */
export const AVISO_VALOR_GENERICO = 'valor genérico — confirme no manual da sua moto'

export const CATALOGO_PADRAO: ItemCatalogoPadrao[] = [
  {
    nome: 'Óleo do motor',
    categoria: 'motor',
    intervalo_km: 3000,
    intervalo_dias: 180,
    observacao: '',
  },
  {
    nome: 'Filtro de óleo',
    categoria: 'motor',
    intervalo_km: 6000,
    intervalo_dias: null,
    observacao: '',
  },
  {
    nome: 'Filtro de ar',
    categoria: 'motor',
    intervalo_km: 10000,
    intervalo_dias: null,
    observacao: '',
  },
  {
    nome: 'Vela de ignição',
    categoria: 'motor',
    intervalo_km: 10000,
    intervalo_dias: null,
    observacao: '',
  },
  {
    nome: 'Folga de válvulas',
    categoria: 'motor',
    intervalo_km: 12000,
    intervalo_dias: null,
    observacao: '',
  },
  {
    nome: 'Lubrificação da corrente',
    categoria: 'transmissao',
    intervalo_km: 500,
    intervalo_dias: 15,
    observacao: '',
  },
  {
    nome: 'Regulagem da corrente',
    categoria: 'transmissao',
    intervalo_km: 1000,
    intervalo_dias: null,
    observacao: '',
  },
  {
    nome: 'Kit relação (corrente, coroa, pinhão)',
    categoria: 'transmissao',
    intervalo_km: 25000,
    intervalo_dias: null,
    observacao: '',
  },
  {
    nome: 'Óleo/fluido de freio',
    categoria: 'freios',
    intervalo_km: null,
    intervalo_dias: 730,
    observacao: '24 meses',
  },
  {
    nome: 'Pastilhas de freio',
    categoria: 'freios',
    intervalo_km: 3000,
    intervalo_dias: null,
    observacao: 'inspeção — trocar quando estiver no limite',
  },
  {
    nome: 'Pneu dianteiro',
    categoria: 'pneus',
    intervalo_km: 1000,
    intervalo_dias: null,
    observacao: 'inspeção de sulco e desgaste',
  },
  {
    nome: 'Pneu traseiro',
    categoria: 'pneus',
    intervalo_km: 1000,
    intervalo_dias: null,
    observacao: 'inspeção de sulco e desgaste',
  },
  {
    nome: 'Calibragem dos pneus',
    categoria: 'pneus',
    intervalo_km: null,
    intervalo_dias: 7,
    observacao: '',
  },
  {
    nome: 'Bateria (teste de carga)',
    categoria: 'eletrica',
    intervalo_km: null,
    intervalo_dias: 180,
    observacao: '',
  },
  {
    nome: 'Óleo do garfo (suspensão)',
    categoria: 'suspensao',
    intervalo_km: 20000,
    intervalo_dias: null,
    observacao: '',
  },
  {
    nome: 'Revisão geral',
    categoria: 'geral',
    intervalo_km: 6000,
    intervalo_dias: 180,
    observacao: '',
  },
]
