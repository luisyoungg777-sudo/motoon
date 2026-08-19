import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Fuel, Receipt, Settings, Wrench } from 'lucide-react'
import CaixaFrase from '@/components/CaixaFrase'
import FolhaRegistrar from '@/components/FolhaRegistrar'
import MotoPalco, { marcaExibicao, modeloExibicao } from '@/components/MotoPalco'
import { Folha, Medidor, Ponto, Rotulo, Skeleton } from '@/components/ui'
import { useMoto } from '@/estado'
import { useConta } from '@/estado-conta'
import { registrarLeitura } from '@/db/repos'
import { COR_STATUS, resumirCustos, type Vencimento } from '@/services/calculos'
import { hojeISO, inicioDoMes, mesAnterior } from '@/services/datas'
import { formatarDinheiro, formatarKm } from '@/services/formato'

function LinhaManutencao({ v }: { v: Vencimento }) {
  const cor = COR_STATUS[v.status]
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Ponto cor={cor} />
          <span className="truncate">{v.item.nome}</span>
        </span>
        <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: cor }}>
          {v.resumo}
        </span>
      </div>
      <Medidor fracao={v.fracaoRestante ?? 1} cor={cor} rotulo={`${v.item.nome}: ${v.resumo}`} />
      {v.semHistorico && <span className="text-micro text-textoFraco">sem histórico ainda</span>}
    </li>
  )
}

export default function Home() {
  const { moto, motos, itens, vencimentos, estimativa, servicos, abastecimentos, despesas, leituras } =
    useMoto()
  const { conta } = useConta()
  const navegar = useNavigate()
  const [registrando, setRegistrando] = useState(false)
  const [tipoInicial, setTipoInicial] = useState<'servico' | 'abastecimento' | 'despesa'>('servico')
  const [corrigindoKm, setCorrigindoKm] = useState(false)
  const [kmNovo, setKmNovo] = useState('')

  if (!moto || !estimativa) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const motoAtiva = moto
  const est = estimativa
  const hoje = hojeISO()

  const mesAtual = resumirCustos(servicos, abastecimentos, despesas, leituras, inicioDoMes(hoje), hoje)
  const anterior = mesAnterior(hoje.slice(0, 7))
  const mesPassado = resumirCustos(
    servicos,
    abastecimentos,
    despesas,
    leituras,
    `${anterior}-01`,
    `${anterior}-31`,
  )

  const variacao =
    mesPassado.total > 0 ? Math.round(((mesAtual.total - mesPassado.total) / mesPassado.total) * 100) : null

  const vencidos = vencimentos.filter((v) => v.status === 'vermelho').length
  const proximas = vencimentos.slice(0, 4)

  async function confirmarKm() {
    const km = Number(kmNovo)
    if (!Number.isFinite(km) || km <= 0) return
    await registrarLeitura(motoAtiva.id, km, hojeISO(), 'manual')
    setCorrigindoKm(false)
    setKmNovo('')
  }

  function abrirRegistro(tipo: 'servico' | 'abastecimento' | 'despesa') {
    setTipoInicial(tipo)
    setRegistrando(true)
  }

  const primeiroNome = conta?.nome?.split(' ')[0]

  return (
    <div className="animate-entrar space-y-6 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {primeiroNome && <p className="text-sm text-textoFraco">Olá, {primeiroNome}</p>}
          <button
            type="button"
            onClick={() => navegar('/garagem')}
            className="-ml-1 flex min-h-toque items-center gap-1 rounded-lg px-1 text-lg font-bold tracking-tight"
          >
            Minha garagem
            {motos.length > 1 && (
              <span className="text-sm font-medium text-textoFraco"> · {motos.length}</span>
            )}
            <ChevronRight className="h-4 w-4 text-textoFraco" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => navegar('/config')}
          aria-label="Ajustes"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-borda bg-superficie text-textoSec hover:text-texto"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <section className="overflow-hidden rounded-xl border border-borda">
        <MotoPalco moto={motoAtiva} altura="h-36" arredondado="rounded-none" />
        <div className="bg-superficie px-4 pb-4 pt-3">
          {marcaExibicao(motoAtiva) && (
            <p className="text-micro font-semibold uppercase tracking-[0.22em] text-primaria">
              {marcaExibicao(motoAtiva)}
            </p>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight">{modeloExibicao(motoAtiva)}</h1>

          <div className="mt-3 flex items-end justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setKmNovo(String(est.km))
                setCorrigindoKm(true)
              }}
              className="text-left"
              aria-label="Corrigir quilometragem"
            >
              <span className="text-painel font-extrabold tabular-nums">
                {formatarKm(est.km).replace(' km', '')}
                <span className="ml-1.5 text-base font-semibold text-textoFraco">km</span>
              </span>
            </button>
            <p className="pb-1.5 text-right text-micro text-textoFraco">
              {est.estimado ? 'estimado · toque para corrigir' : 'atualizado hoje'}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <CaixaFrase moto={motoAtiva} itens={itens} kmEstimado={est.km} />
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { tipo: 'servico', rotulo: 'Serviço', Icone: Wrench },
              { tipo: 'abastecimento', rotulo: 'Abastecer', Icone: Fuel },
              { tipo: 'despesa', rotulo: 'Despesa', Icone: Receipt },
            ] as const
          ).map(({ tipo, rotulo, Icone }) => (
            <button
              key={tipo}
              type="button"
              onClick={() => abrirRegistro(tipo)}
              className="flex min-h-toque flex-col items-center justify-center gap-1.5 rounded-lg border border-borda bg-superficie py-3 text-xs font-semibold text-textoSec transition-colors hover:text-texto"
            >
              <Icone className="h-[18px] w-[18px]" />
              {rotulo}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Rotulo>Próximas manutenções</Rotulo>
          {vencidos > 0 && (
            <span className="text-micro font-bold uppercase text-perigo">
              {vencidos} {vencidos === 1 ? 'vencida' : 'vencidas'}
            </span>
          )}
        </div>

        {proximas.length === 0 ? (
          <p className="text-corpo text-textoSec">Nenhum item sendo acompanhado ainda.</p>
        ) : (
          <ul className="space-y-4">
            {proximas.map((v) => (
              <LinhaManutencao key={v.item.id} v={v} />
            ))}
          </ul>
        )}

        <button
          type="button"
          className="flex min-h-toque w-full items-center justify-between text-sm font-semibold text-textoSec hover:text-texto"
          onClick={() => navegar(`/moto/${motoAtiva.id}/itens`)}
        >
          Ver toda a manutenção
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <section className="flex items-end justify-between gap-3 border-t border-borda pt-4">
        <div>
          <Rotulo>Custo este mês</Rotulo>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {formatarDinheiro(mesAtual.total)}
          </p>
        </div>
        {variacao !== null && (
          <p
            className="pb-1 text-sm font-semibold"
            style={{ color: variacao > 0 ? COR_STATUS.vermelho : COR_STATUS.verde }}
          >
            {variacao > 0 ? '+' : ''}
            {variacao}% vs mês passado
          </p>
        )}
      </section>

      <FolhaRegistrar
        aberta={registrando}
        aoFechar={() => setRegistrando(false)}
        moto={motoAtiva}
        itens={itens}
        vencimentos={vencimentos}
        kmEstimado={est.km}
        tipoInicial={tipoInicial}
      />

      <Folha aberta={corrigindoKm} aoFechar={() => setCorrigindoKm(false)} titulo="Km do painel">
        <div className="space-y-4 pb-4">
          <p className="text-corpo text-textoSec">
            Olha o painel e digita o número certo. É isso que deixa as previsões afiadas.
          </p>
          <input
            className="campo text-2xl font-bold tabular-nums"
            inputMode="numeric"
            value={kmNovo}
            onChange={(e) => setKmNovo(e.target.value.replace(/\D/g, '').slice(0, 7))}
            autoFocus
          />
          <button type="button" className="btn-laranja w-full text-lg" onClick={confirmarKm}>
            SALVAR KM
          </button>
        </div>
      </Folha>
    </div>
  )
}
