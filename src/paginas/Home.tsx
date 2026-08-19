import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CaixaFrase from '@/components/CaixaFrase'
import FolhaRegistrar from '@/components/FolhaRegistrar'
import { BarraProgresso, Folha, Selo, Vazio } from '@/components/ui'
import { IcoMais, IcoMoto } from '@/components/icones'
import { useMoto } from '@/estado'
import { AVISO_VALOR_GENERICO } from '@/data/catalogo-padrao'
import { COR_STATUS, descreverUltimoServico, type Vencimento } from '@/services/calculos'
import { formatarKm } from '@/services/formato'
import { hojeISO } from '@/services/datas'
import { registrarLeitura } from '@/db/repos'

function LinhaVencimento({ v }: { v: Vencimento }) {
  const cor = COR_STATUS[v.status]
  return (
    <li className="painel space-y-2 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{v.item.nome}</p>
          <p className="text-xs text-apagado">{descreverUltimoServico(v)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-black" style={{ color: cor }}>
            {v.resumo}
          </p>
          {v.semHistorico && (
            <span className="text-[10px] uppercase tracking-wide text-apagado">sem histórico</span>
          )}
        </div>
      </div>
      <BarraProgresso fracao={v.fracaoRestante ?? 1} cor={cor} />
      {v.item.fonte === 'padrao' && (
        <p className="text-[11px] text-apagado">{AVISO_VALOR_GENERICO}</p>
      )}
    </li>
  )
}

export default function Home() {
  const { moto, motos, trocarMoto, itens, vencimentos, estimativa } = useMoto()
  const navegar = useNavigate()
  const [registrando, setRegistrando] = useState(false)
  const [corrigindoKm, setCorrigindoKm] = useState(false)
  const [kmNovo, setKmNovo] = useState('')

  if (!moto || !estimativa) return null

  const motoAtiva = moto
  const est = estimativa
  const vencidos = vencimentos.filter((v) => v.status === 'vermelho')
  const proximos = vencimentos.filter((v) => v.status !== 'vermelho').slice(0, 6)

  async function confirmarKm() {
    const km = Number(kmNovo)
    if (!Number.isFinite(km) || km <= 0) return
    await registrarLeitura(motoAtiva.id, km, hojeISO(), 'manual')
    setCorrigindoKm(false)
    setKmNovo('')
  }

  return (
    <div className="space-y-5 px-4 pt-4">
      {motos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {motos.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => trocarMoto(m.id)}
              className={`chip shrink-0 ${m.id === moto.id ? 'chip-ativo' : ''}`}
            >
              {m.apelido}
            </button>
          ))}
        </div>
      )}

      <header className="painel flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-painel2 text-laranja">
          <IcoMoto className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black tracking-tight">{moto.apelido}</h1>
          <p className="truncate text-xs text-apagado">
            {[moto.marca, moto.modelo, moto.placa].filter(Boolean).join(' · ') || 'sem dados'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setKmNovo(String(est.km))
            setCorrigindoKm(true)
          }}
          className="shrink-0 text-right"
        >
          <span className="num-grande block">
            {estimativa.estimado && <span className="text-apagado">~</span>}
            {formatarKm(estimativa.km).replace(' km', '')}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-apagado">
            km {estimativa.estimado ? 'estimado' : 'atual'}
          </span>
        </button>
      </header>

      <CaixaFrase moto={moto} itens={itens} kmEstimado={estimativa.km} />

      <section className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-widest text-apagado">
          O que está vencendo
        </h2>

        {vencimentos.length === 0 ? (
          <Vazio
            titulo="Nenhum item de manutenção cadastrado."
            acao="Ver itens"
            aoAgir={() => navegar(`/moto/${motoAtiva.id}/itens`)}
          />
        ) : (
          <>
            {vencidos.length > 0 && (
              <div className="flex items-center gap-2">
                <Selo cor="vermelho">{vencidos.length} vencido{vencidos.length > 1 ? 's' : ''}</Selo>
              </div>
            )}
            <ul className="space-y-2">
              {[...vencidos, ...proximos].map((v) => (
                <LinhaVencimento key={v.item.id} v={v} />
              ))}
            </ul>
            <button
              type="button"
              className="btn-fantasma w-full"
              onClick={() => navegar(`/moto/${motoAtiva.id}/itens`)}
            >
              Ver todos os itens
            </button>
          </>
        )}
      </section>

      <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg px-4 pb-[76px]">
        <button
          type="button"
          className="btn-laranja pointer-events-auto w-full text-lg shadow-lg shadow-black/40"
          onClick={() => setRegistrando(true)}
        >
          <IcoMais className="h-6 w-6" />
          REGISTRAR
        </button>
      </div>

      <FolhaRegistrar
        aberta={registrando}
        aoFechar={() => setRegistrando(false)}
        moto={moto}
        itens={itens}
        vencimentos={vencimentos}
        kmEstimado={estimativa.km}
      />

      <Folha aberta={corrigindoKm} aoFechar={() => setCorrigindoKm(false)} titulo="Km do painel">
        <div className="space-y-4 pb-4">
          <p className="text-sm text-apagado">
            Olha o painel e digita o número certo. É isso que deixa as previsões afiadas.
          </p>
          <input
            className="campo text-2xl font-black"
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
