import { novoRegistro, salvarAbastecimento, salvarDespesa, salvarServico } from '@/db/repos'
import type { Lancamento } from './parser'
import type { ItemManutencao, Moto } from '@/types'

export interface ContextoSalvar {
  moto: Moto
  itens: ItemManutencao[]
  /**
   * false quando o km do formulário é a estimativa automática que o usuário
   * não encostou. Nesse caso o registro guarda o km (o cálculo de vencimento
   * precisa dele) mas não vira leitura de odômetro — senão a projeção passa
   * a se alimentar das próprias projeções.
   */
  kmConfirmado: boolean
  /** Campos que só a folha de registro preenche — o parser não os extrai. */
  extras?: {
    local?: string
    observacao?: string
    foto_url?: string | null
    posto?: string
  }
}

export async function salvarLancamento(l: Lancamento, ctx: ContextoSalvar): Promise<void> {
  const { moto, itens, kmConfirmado, extras } = ctx

  if (l.tipo === 'abastecimento') {
    await salvarAbastecimento(
      {
        ...novoRegistro(),
        moto_id: moto.id,
        data: l.data,
        km: l.km,
        litros: l.litros,
        valor_total: l.valor,
        valor_litro: null,
        tipo_combustivel: l.tipoCombustivel ?? 'gasolina',
        tanque_cheio: l.tanqueCheio,
        posto: extras?.posto ?? '',
      },
      kmConfirmado,
    )
    return
  }

  if (l.tipo === 'despesa') {
    await salvarDespesa({
      ...novoRegistro(),
      moto_id: moto.id,
      data: l.data,
      categoria: l.categoriaDespesa ?? 'outro',
      descricao: l.descricao.trim(),
      valor: l.valor,
    })
    return
  }

  const item = l.itemNome ? (itens.find((i) => i.nome === l.itemNome) ?? null) : null

  await salvarServico(
    {
      ...novoRegistro(),
      moto_id: moto.id,
      item_id: item?.id ?? null,
      descricao: item?.nome ?? l.descricao.trim(),
      data: l.data,
      km: l.km,
      valor: l.valor,
      local: extras?.local ?? '',
      observacao: extras?.observacao ?? '',
      foto_url: extras?.foto_url ?? null,
    },
    kmConfirmado,
  )
}
