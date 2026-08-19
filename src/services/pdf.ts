import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatarData, hojeISO } from './datas'
import { formatarDinheiro, formatarKm } from './formato'
import type { Vencimento } from './calculos'
import type { Moto, Servico } from '@/types'

export interface DadosRelatorio {
  moto: Moto
  servicos: Servico[]
  vencimentos: Vencimento[]
  kmAtual: number
  totalGasto: number
}

const CINZA = '#555555'

export function gerarRelatorioPdf(dados: DadosRelatorio): void {
  const { moto, vencimentos, kmAtual, totalGasto } = dados
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const hoje = hojeISO()

  const servicos = [...dados.servicos].sort((a, b) => (a.data < b.data ? 1 : -1))
  const datas = servicos.map((s) => s.data).sort()
  const periodo =
    datas.length > 0 ? `${formatarData(datas[0])} a ${formatarData(datas[datas.length - 1])}` : '—'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Histórico de manutenção', 40, 52)

  doc.setFontSize(13)
  doc.text(moto.apelido, 40, 76)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(CINZA)

  const identificacao = [
    [moto.marca, moto.modelo, moto.ano ? String(moto.ano) : ''].filter(Boolean).join(' '),
    moto.placa ? `Placa ${moto.placa}` : '',
    `Km atual ${formatarKm(kmAtual)}`,
    `Período ${periodo}`,
  ].filter(Boolean)

  identificacao.forEach((linha, i) => doc.text(linha, 40, 94 + i * 14))

  const inicioTabela = 94 + identificacao.length * 14 + 12

  autoTable(doc, {
    startY: inicioTabela,
    head: [['Data', 'Km', 'Item', 'Local', 'Valor']],
    body:
      servicos.length > 0
        ? servicos.map((s) => [
            formatarData(s.data),
            s.km !== null ? formatarKm(s.km) : '—',
            s.descricao,
            s.local || '—',
            s.valor !== null ? formatarDinheiro(s.valor) : '—',
          ])
        : [['—', '—', 'Nenhum serviço registrado', '—', '—']],
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: '#111111' },
    headStyles: { fillColor: '#1C2027', textColor: '#FFFFFF', fontStyle: 'bold' },
    alternateRowStyles: { fillColor: '#F4F5F7' },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 62 },
      4: { cellWidth: 70, halign: 'right' },
    },
    margin: { left: 40, right: 40 },
  })

  const depoisDaTabela =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? inicioTabela

  const emDia = vencimentos.filter((v) => v.status === 'verde')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor('#111111')
  doc.text('Resumo', 40, depoisDaTabela + 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(CINZA)

  const resumo = [
    `Serviços registrados: ${servicos.length}`,
    `Total gasto no período: ${formatarDinheiro(totalGasto)}`,
    `Itens em dia em ${formatarData(hoje)}: ${emDia.length} de ${vencimentos.length}`,
  ]
  resumo.forEach((linha, i) => doc.text(linha, 40, depoisDaTabela + 50 + i * 14))

  if (emDia.length < vencimentos.length) {
    autoTable(doc, {
      startY: depoisDaTabela + 50 + resumo.length * 14 + 10,
      head: [['Item', 'Situação']],
      body: vencimentos
        .filter((v) => v.status !== 'verde')
        .map((v) => [v.item.nome, v.semHistorico ? `${v.resumo} (sem histórico)` : v.resumo]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: '#111111' },
      headStyles: { fillColor: '#1C2027', textColor: '#FFFFFF', fontStyle: 'bold' },
      margin: { left: 40, right: 40 },
    })
  }

  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(CINZA)
    doc.text(
      `Emitido pelo Motoon em ${formatarData(hoje)}`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    )
    doc.text(
      `${p}/${paginas}`,
      doc.internal.pageSize.getWidth() - 40,
      doc.internal.pageSize.getHeight() - 24,
      { align: 'right' },
    )
  }

  const nome = `motoon-${(moto.placa || moto.apelido).toLowerCase().replace(/[^a-z0-9]/g, '')}-${hoje}.pdf`
  doc.save(nome)
}
