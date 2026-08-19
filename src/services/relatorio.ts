import { resumirCustos, type Vencimento } from './calculos'
import type { Abastecimento, Despesa, LeituraOdometro, Moto, Servico } from '@/types'

export interface DadosDaMoto {
  moto: Moto
  servicos: Servico[]
  abastecimentos: Abastecimento[]
  despesas: Despesa[]
  leituras: LeituraOdometro[]
  vencimentos: Vencimento[]
  kmAtual: number
}

/**
 * O jsPDF arrasta html2canvas e dompurify — uns 420 kB que não servem para
 * nada aqui, já que o relatório é só texto e tabela. Carregar sob demanda
 * tira esse peso da abertura do app, que é o que importa para quem está na
 * rua com dado móvel. O import() só dispara quando o botão é tocado.
 */
export async function gerarPdfDaMoto(dados: DadosDaMoto): Promise<void> {
  const { gerarRelatorioPdf } = await import('./pdf')

  const totalGasto = resumirCustos(
    dados.servicos,
    dados.abastecimentos,
    dados.despesas,
    dados.leituras,
    null,
    null,
  ).total

  gerarRelatorioPdf({
    moto: dados.moto,
    servicos: dados.servicos,
    vencimentos: dados.vencimentos,
    kmAtual: dados.kmAtual,
    totalGasto,
  })
}
