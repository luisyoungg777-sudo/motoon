import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, List, Pencil, Plus, Wallet, Wrench } from 'lucide-react'
import MotoPalco, { marcaExibicao, modeloCompleto, modeloExibicao } from '@/components/MotoPalco'
import { TrocarFoto } from '@/components/TrocarFoto'
import FolhaRegistrar from '@/components/FolhaRegistrar'
import { Medidor, Ponto, Rotulo, Skeleton } from '@/components/ui'
import { useMoto } from '@/estado'
import { COR_STATUS, calcularSaude, corSaude } from '@/services/calculos'
import { gerarPdfDaMoto } from '@/services/relatorio'
import { formatarKm } from '@/services/formato'

export default function DetalheMoto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const {
    moto,
    trocarMoto,
    itens,
    vencimentos,
    estimativa,
    servicos,
    abastecimentos,
    despesas,
    leituras,
  } = useMoto()
  const [registrando, setRegistrando] = useState(false)

  // A tela mostra sempre a moto da URL — abrir uma moto na garagem também a
  // torna a ativa, senão o botão de registrar gravaria na moto errada.
  useEffect(() => {
    if (id && moto && id !== moto.id) trocarMoto(id)
  }, [id, moto, trocarMoto])

  if (!moto || !estimativa || (id && id !== moto.id)) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  const motoAtiva = moto
  const est = estimativa
  const saude = calcularSaude(vencimentos)
  const cor = corSaude(saude.percentual)

  const acoes = [
    { rotulo: 'Histórico', Icone: List, aoTocar: () => navegar('/historico') },
    { rotulo: 'Custos', Icone: Wallet, aoTocar: () => navegar('/custos') },
    {
      rotulo: 'Manutenção',
      Icone: Wrench,
      aoTocar: () => navegar(`/moto/${motoAtiva.id}/itens`),
    },
    {
      rotulo: 'Relatório',
      Icone: FileText,
      aoTocar: () =>
        gerarPdfDaMoto({
          moto: motoAtiva,
          servicos,
          abastecimentos,
          despesas,
          leituras,
          vencimentos,
          kmAtual: est.km,
        }),
    },
  ]

  return (
    <div className="animate-entrar space-y-6 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navegar('/garagem')}
          className="-ml-2 flex min-h-toque items-center gap-2 rounded-lg px-2 text-sm font-medium text-textoSec hover:text-texto"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
          Minha garagem
        </button>
        <button
          type="button"
          onClick={() => navegar(`/moto/${motoAtiva.id}`)}
          aria-label="Editar moto"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-borda bg-superficie text-textoSec hover:text-texto"
        >
          <Pencil className="h-[18px] w-[18px]" />
        </button>
      </header>

      <section className="relative overflow-hidden rounded-xl border border-borda">
        <TrocarFoto moto={motoAtiva} className="absolute right-3 top-3 z-10" />
        <MotoPalco moto={motoAtiva} altura="h-40" arredondado="rounded-none" />
        <div className="bg-superficie px-4 pb-4 pt-3">
          {marcaExibicao(motoAtiva) && (
            <p className="text-micro font-semibold uppercase tracking-[0.22em] text-primaria">
              {marcaExibicao(motoAtiva)}
            </p>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight">{modeloExibicao(motoAtiva)}</h1>
          {modeloCompleto(motoAtiva) !== modeloExibicao(motoAtiva) && (
            <p className="text-micro text-textoFraco">{modeloCompleto(motoAtiva)}</p>
          )}
          <p className="mt-1 text-corpo text-textoSec">
            {[
              motoAtiva.ano ?? motoAtiva.catalogo_ano,
              formatarKm(est.km),
              motoAtiva.placa || null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <Rotulo>Saúde da moto</Rotulo>
        {saude.percentual === null ? (
          <div>
            <p className="text-xl font-bold text-textoSec">Dados insuficientes</p>
            <p className="mt-1 text-corpo text-textoSec">
              Registre alguns serviços para o DiasdMoto conseguir medir. Com {saude.considerados} de{' '}
              {saude.considerados + saude.semHistorico} itens com histórico, qualquer nota seria
              chute.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3">
              <span className="text-painel font-extrabold tabular-nums" style={{ color: cor }}>
                {saude.percentual}
                <span className="text-2xl">%</span>
              </span>
              <p className="pb-2 text-corpo text-textoSec">{saude.rotulo}</p>
            </div>
            <Medidor fracao={saude.percentual / 100} cor={cor} rotulo="Saúde da manutenção" />
            {saude.semHistorico > 0 && (
              <p className="text-micro text-textoFraco">
                {saude.semHistorico}{' '}
                {saude.semHistorico === 1 ? 'item ficou de fora' : 'itens ficaram de fora'} por
                nunca terem sido registrados.
              </p>
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <Rotulo>Próximos serviços</Rotulo>
        {vencimentos.length === 0 ? (
          <p className="text-corpo text-textoSec">Nenhum item sendo acompanhado.</p>
        ) : (
          <ul className="space-y-4">
            {vencimentos.slice(0, 6).map((v) => {
              const c = COR_STATUS[v.status]
              return (
                <li key={v.item.id} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                      <Ponto cor={c} />
                      <span className="truncate">{v.item.nome}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: c }}>
                      {v.resumo}
                    </span>
                  </div>
                  <Medidor fracao={v.fracaoRestante ?? 1} cor={c} rotulo={v.item.nome} />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="grid grid-cols-2 gap-2">
        {acoes.map(({ rotulo, Icone, aoTocar }) => (
          <button
            key={rotulo}
            type="button"
            onClick={aoTocar}
            className="flex min-h-toque items-center gap-3 rounded-lg border border-borda bg-superficie px-4 py-3 text-sm font-semibold text-textoSec transition-colors hover:text-texto"
          >
            <Icone className="h-[18px] w-[18px]" />
            {rotulo}
          </button>
        ))}
      </section>

      <button
        type="button"
        className="btn-laranja w-full text-lg"
        onClick={() => setRegistrando(true)}
      >
        <Plus className="h-5 w-5" />
        REGISTRAR
      </button>

      <FolhaRegistrar
        aberta={registrando}
        aoFechar={() => setRegistrando(false)}
        moto={motoAtiva}
        itens={itens}
        vencimentos={vencimentos}
        kmEstimado={est.km}
      />
    </div>
  )
}
