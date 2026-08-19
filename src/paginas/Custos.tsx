import { useMemo, useState } from 'react'
import { Alternador, Vazio } from '@/components/ui'
import GraficoBarras, { type BarraMes } from '@/components/GraficoBarras'
import { IcoPdf } from '@/components/icones'
import { useMoto } from '@/estado'
import { calcularConsumo, resumirCustos } from '@/services/calculos'
import { hojeISO, inicioDoAno, inicioDoMes, mesAnterior, rotuloMes } from '@/services/datas'
import { formatarDinheiro, formatarDinheiroCurto, formatarKm, formatarNumero } from '@/services/formato'
import { gerarPdfDaMoto } from '@/services/relatorio'

type Periodo = 'mes' | 'ano' | 'tudo'

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-linha py-2 last:border-0">
      <span className="text-sm text-apagado">{rotulo}</span>
      <span className="font-bold">{valor}</span>
    </div>
  )
}

export default function Custos() {
  const { moto, servicos, abastecimentos, despesas, leituras, vencimentos, estimativa } = useMoto()
  const [periodo, setPeriodo] = useState<Periodo>('mes')

  const hoje = hojeISO()

  const recorte = useMemo(() => {
    if (periodo === 'mes') return { de: inicioDoMes(hoje), ate: hoje, rotulo: 'este mês' }
    if (periodo === 'ano') return { de: inicioDoAno(hoje), ate: hoje, rotulo: 'este ano' }
    return { de: null, ate: null, rotulo: 'desde o começo' }
  }, [periodo, hoje])

  const atual = useMemo(
    () => resumirCustos(servicos, abastecimentos, despesas, leituras, recorte.de, recorte.ate),
    [servicos, abastecimentos, despesas, leituras, recorte],
  )

  const anterior = useMemo(() => {
    if (periodo === 'tudo') return null
    if (periodo === 'mes') {
      const mes = mesAnterior(hoje.slice(0, 7))
      return {
        rotulo: 'mês passado',
        resumo: resumirCustos(servicos, abastecimentos, despesas, leituras, `${mes}-01`, `${mes}-31`),
      }
    }
    const ano = Number(hoje.slice(0, 4)) - 1
    return {
      rotulo: 'ano passado',
      resumo: resumirCustos(
        servicos,
        abastecimentos,
        despesas,
        leituras,
        `${ano}-01-01`,
        `${ano}-12-31`,
      ),
    }
  }, [periodo, hoje, servicos, abastecimentos, despesas, leituras])

  const consumo = useMemo(() => calcularConsumo(abastecimentos), [abastecimentos])

  const barras = useMemo<BarraMes[]>(() => {
    const meses: BarraMes[] = []
    let cursor = hoje.slice(0, 7)
    for (let i = 0; i < 12; i++) {
      meses.unshift({ anoMes: cursor, rotulo: rotuloMes(cursor), valor: 0 })
      cursor = mesAnterior(cursor)
    }
    const indice = new Map(meses.map((m, i) => [m.anoMes, i]))
    const somar = (data: string, valor: number | null) => {
      const i = indice.get(data.slice(0, 7))
      if (i !== undefined) meses[i].valor += valor ?? 0
    }
    servicos.forEach((s) => somar(s.data, s.valor))
    abastecimentos.forEach((a) => somar(a.data, a.valor_total))
    despesas.forEach((d) => somar(d.data, d.valor))
    return meses
  }, [hoje, servicos, abastecimentos, despesas])

  if (!moto || !estimativa) return null

  const motoAtiva = moto
  const est = estimativa
  const semNada = atual.total === 0 && servicos.length === 0 && abastecimentos.length === 0

  return (
    <div className="space-y-5 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-black tracking-tight">Custos</h1>

      <Alternador
        opcoes={[
          { valor: 'mes', rotulo: 'Mês' },
          { valor: 'ano', rotulo: 'Ano' },
          { valor: 'tudo', rotulo: 'Tudo' },
        ]}
        valor={periodo}
        aoTrocar={setPeriodo}
      />

      {semNada ? (
        <Vazio titulo="Nenhum gasto registrado ainda — registre o primeiro na tela da moto." />
      ) : (
        <>
          <section className="painel p-4">
            <p className="text-xs uppercase tracking-widest text-apagado">Total {recorte.rotulo}</p>
            <p className="num-grande mt-1 text-laranja">{formatarDinheiro(atual.total)}</p>
            {anterior && (
              <p className="mt-1 text-xs text-apagado">
                {recorte.rotulo} {formatarDinheiroCurto(atual.total)} · {anterior.rotulo}{' '}
                {formatarDinheiroCurto(anterior.resumo.total)}
              </p>
            )}
            <div className="mt-3">
              <Linha rotulo="Combustível" valor={formatarDinheiro(atual.combustivel)} />
              <Linha rotulo="Manutenção" valor={formatarDinheiro(atual.manutencao)} />
              <Linha rotulo="Outras despesas" valor={formatarDinheiro(atual.outras)} />
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="painel p-3">
              <p className="text-xs uppercase tracking-widest text-apagado">Custo por km</p>
              <p className="mt-1 text-2xl font-black">
                {atual.custoPorKm !== null ? formatarDinheiro(atual.custoPorKm) : '—'}
              </p>
              <p className="text-[11px] text-apagado">
                {atual.kmRodados > 0 ? `${formatarKm(atual.kmRodados)} no período` : 'sem km no período'}
              </p>
            </div>
            <div className="painel p-3">
              <p className="text-xs uppercase tracking-widest text-apagado">Consumo médio</p>
              <p className="mt-1 text-2xl font-black">
                {consumo.kmPorLitro !== null ? `${formatarNumero(consumo.kmPorLitro, 1)} km/l` : '—'}
              </p>
              <p className="text-[11px] text-apagado">
                {consumo.trechos > 0
                  ? `${consumo.trechos} ${consumo.trechos === 1 ? 'trecho' : 'trechos'} de tanque cheio`
                  : 'precisa de 2 tanques cheios'}
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-apagado">
              Últimos 12 meses
            </h2>
            <GraficoBarras barras={barras} />
          </section>
        </>
      )}

      <button
        type="button"
        className="btn-escuro w-full"
        onClick={() =>
          gerarPdfDaMoto({
            moto: motoAtiva,
            servicos,
            abastecimentos,
            despesas,
            leituras,
            vencimentos,
            kmAtual: est.km,
          })
        }
      >
        <IcoPdf className="h-5 w-5" />
        GERAR PDF
      </button>
    </div>
  )
}
