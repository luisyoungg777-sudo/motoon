export type CategoriaItem =
  | 'motor'
  | 'transmissao'
  | 'freios'
  | 'pneus'
  | 'eletrica'
  | 'suspensao'
  | 'geral'

export type PerfilUso = 'urbano_leve' | 'urbano_pesado' | 'trilha'

export type FonteItem = 'padrao' | 'manual_fabricante' | 'usuario'

export type OrigemLeitura = 'manual' | 'servico' | 'abastecimento'

export type TipoCombustivel = 'gasolina' | 'gasolina_aditivada' | 'etanol' | 'outro'

export type CategoriaDespesa =
  | 'seguro'
  | 'ipva'
  | 'licenciamento'
  | 'multa'
  | 'equipamento'
  | 'pedagio'
  | 'lavagem'
  | 'estacionamento'
  | 'financiamento'
  | 'outro'

/** Campos que todo registro sincronizável carrega. */
export interface RegistroBase {
  id: string
  updated_at: string
  deleted_at: string | null
}

export interface Moto extends RegistroBase {
  apelido: string
  marca: string
  modelo: string
  ano: number | null
  placa: string
  cor: string
  km_inicial: number
  foto_url: string | null
  criada_em: string
  arquivada: boolean
  perfil_uso: PerfilUso

  /**
   * Vindos do catálogo, todos opcionais. Moto cadastrada antes da Fase 4 não
   * tem nenhum destes e continua funcionando — o app cai em `marca`/`modelo`.
   * Como são campos sem índice, o IndexedDB aceita sem migration.
   */
  catalogo_id?: string
  catalogo_marca?: string
  catalogo_modelo?: string
  catalogo_categoria?: CategoriaMoto
  catalogo_ano?: number
  catalogo_imagem_url?: string
  catalogo_fonte_url?: string
}

export interface LeituraOdometro extends RegistroBase {
  moto_id: string
  km: number
  data: string
  origem: OrigemLeitura
}

export interface ItemManutencao extends RegistroBase {
  moto_id: string
  nome: string
  categoria: CategoriaItem
  intervalo_km: number | null
  intervalo_dias: number | null
  ativo: boolean
  observacao: string
  fonte: FonteItem
}

export interface Servico extends RegistroBase {
  moto_id: string
  item_id: string | null
  descricao: string
  data: string
  km: number | null
  valor: number | null
  local: string
  observacao: string
  foto_url: string | null
}

export interface Abastecimento extends RegistroBase {
  moto_id: string
  data: string
  km: number | null
  litros: number | null
  valor_total: number | null
  valor_litro: number | null
  tipo_combustivel: TipoCombustivel
  tanque_cheio: boolean
  posto: string
}

export interface Despesa extends RegistroBase {
  moto_id: string
  data: string
  categoria: CategoriaDespesa
  descricao: string
  valor: number | null
}

// ------------------------------------------------- catálogo de motocicletas

export type CategoriaMoto =
  | 'street'
  | 'naked'
  | 'scooter'
  | 'trail'
  | 'adventure'
  | 'esportiva'
  | 'off-road'
  | 'racing'
  | 'touring'
  | 'ciclomotor'
  | 'eletrica'

export const ROTULO_CATEGORIA_MOTO: Record<CategoriaMoto, string> = {
  street: 'Street',
  naked: 'Naked',
  scooter: 'Scooter',
  trail: 'Trail',
  adventure: 'Adventure',
  esportiva: 'Esportiva',
  'off-road': 'Off Road',
  racing: 'Racing',
  touring: 'Touring',
  ciclomotor: 'Ciclomotor',
  eletrica: 'Elétrica',
}

/**
 * De onde veio a informação deste modelo. Item 46: o catálogo não inventa.
 *  - 'oficial': li o modelo na página do fabricante.
 *  - 'linha-conhecida': modelo consolidado no mercado brasileiro que não
 *     consegui confirmar na fonte nesta execução. Entra, mas marcado.
 */
export type ProcedenciaModelo = 'oficial' | 'linha-conhecida'

export interface ModeloMoto {
  id: string
  marca: string
  modelo: string
  categoria: CategoriaMoto
  ano?: number
  /** Vazio por decisão de projeto — ver README, seção do catálogo. */
  imagemUrl?: string
  fonteUrl?: string
  fonteTipo?: 'fabricante'
  procedencia: ProcedenciaModelo
  /** true quando o dado precisa de conferência humana antes de virar verdade. */
  revisar?: boolean
  ativa: boolean
}

export type TipoLancamento = 'servico' | 'abastecimento' | 'despesa'

export type Confianca = 'alta' | 'media' | 'baixa'

export const ROTULO_TIPO_LANCAMENTO: Record<TipoLancamento, string> = {
  servico: 'Serviço',
  abastecimento: 'Abastecimento',
  despesa: 'Despesa',
}

export type NomeTabela =
  | 'motos'
  | 'leituras_odometro'
  | 'itens_manutencao'
  | 'servicos'
  | 'abastecimentos'
  | 'despesas'

export type OperacaoSync = 'upsert' | 'delete'

export interface ItemFilaSync {
  seq?: number
  tabela: NomeTabela
  registro_id: string
  operacao: OperacaoSync
  criado_em: string
  tentativas: number
}

export const ROTULO_CATEGORIA_ITEM: Record<CategoriaItem, string> = {
  motor: 'Motor',
  transmissao: 'Transmissão',
  freios: 'Freios',
  pneus: 'Pneus',
  eletrica: 'Elétrica',
  suspensao: 'Suspensão',
  geral: 'Geral',
}

export const ROTULO_CATEGORIA_DESPESA: Record<CategoriaDespesa, string> = {
  seguro: 'Seguro',
  ipva: 'IPVA',
  licenciamento: 'Licenciamento',
  multa: 'Multa',
  equipamento: 'Equipamento',
  pedagio: 'Pedágio',
  lavagem: 'Lavagem',
  estacionamento: 'Estacionamento',
  financiamento: 'Financiamento',
  outro: 'Outro',
}

export const ROTULO_COMBUSTIVEL: Record<TipoCombustivel, string> = {
  gasolina: 'Gasolina',
  gasolina_aditivada: 'Gasolina aditivada',
  etanol: 'Etanol',
  outro: 'Outro',
}

export const ROTULO_PERFIL: Record<PerfilUso, string> = {
  urbano_leve: 'Urbano leve',
  urbano_pesado: 'Urbano pesado',
  trilha: 'Trilha / terra',
}

/** Uso severo encurta os intervalos. Aplicado só a itens de fonte 'padrao'. */
export const FATOR_PERFIL: Record<PerfilUso, number> = {
  urbano_leve: 1,
  urbano_pesado: 0.7,
  trilha: 0.5,
}
