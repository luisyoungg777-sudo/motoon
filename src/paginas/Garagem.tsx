import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import MotoPalco, { marcaExibicao, modeloExibicao } from '@/components/MotoPalco'
import { Medidor, Rotulo, Selo, Skeleton, Vazio } from '@/components/ui'
import { db } from '@/db/db'
import { useMoto } from '@/estado'
import {
  calcularSaude,
  calcularVencimentos,
  corSaude,
  estimarKm,
  type SaudeMoto,
} from '@/services/calculos'
import { hojeISO } from '@/services/datas'
import { formatarKm } from '@/services/formato'
import type { Moto } from '@/types'

interface Resumo {
  moto: Moto
  km: number
  saude: SaudeMoto
}

export default function Garagem() {
  const { motos, moto: ativa, trocarMoto, carregando } = useMoto()
  const navegar = useNavigate()

  /**
   * A garagem precisa da saúde de TODAS as motos, não só da ativa — o
   * provedor global carrega uma moto por vez de propósito, para a Home não
   * pagar por garagem grande. Aqui a consulta é feita uma vez, nesta tela.
   */
  const resumos = useLiveQuery<Resumo[] | undefined>(async () => {
    if (motos.length === 0) return []
    const hoje = hojeISO()

    return Promise.all(
      motos.map(async (moto) => {
        const [itens, servicos, leituras] = await Promise.all([
          db.itens_manutencao.where('moto_id').equals(moto.id).toArray(),
          db.servicos.where('moto_id').equals(moto.id).toArray(),
          db.leituras_odometro.where('moto_id').equals(moto.id).toArray(),
        ])
        const vivos = <T extends { deleted_at: string | null }>(l: T[]) =>
          l.filter((r) => r.deleted_at === null)

        const est = estimarKm(vivos(leituras), moto, hoje)
        const venc = calcularVencimentos(vivos(itens), vivos(servicos), moto, est.km, hoje)
        return { moto, km: est.km, saude: calcularSaude(venc) }
      }),
    )
  }, [motos])

  if (carregando || resumos === undefined) {
    return (
      <div className="space-y-4 px-4 pt-4">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="animate-entrar space-y-5 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-textoFraco">
            {motos.length} {motos.length === 1 ? 'moto' : 'motos'}
          </p>
          <h1 className="text-titulo font-bold">Minha garagem</h1>
        </div>
        <button
          type="button"
          onClick={() => navegar('/moto/nova')}
          aria-label="Adicionar moto"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-borda bg-superficie text-textoSec hover:text-texto"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      {resumos.length === 0 ? (
        <Vazio
          titulo="Sua garagem está vazia. Cadastre sua primeira moto e comece a acompanhar manutenção e gastos."
          acao="+ ADICIONAR MOTO"
          aoAgir={() => navegar('/moto/nova')}
        />
      ) : (
        <ul className="space-y-4">
          {resumos.map(({ moto, km, saude }) => {
            const ehAtiva = moto.id === ativa?.id
            const cor = corSaude(saude.percentual)
            return (
              <li key={moto.id}>
                <button
                  type="button"
                  onClick={() => {
                    trocarMoto(moto.id)
                    navegar('/')
                  }}
                  className={`w-full overflow-hidden rounded-xl border text-left transition-opacity ${
                    ehAtiva ? 'border-borda' : 'border-borda opacity-70 hover:opacity-100'
                  }`}
                >
                  <MotoPalco moto={moto} altura="h-28" arredondado="rounded-none" />
                  <div className="space-y-3 bg-superficie px-4 pb-4 pt-3">
                    <div>
                      {ehAtiva && <Selo cor="laranja">ativa</Selo>}
                      {marcaExibicao(moto) && (
                        <p className="mt-1.5 text-micro font-semibold uppercase tracking-[0.22em] text-primaria">
                          {marcaExibicao(moto)}
                        </p>
                      )}
                      <p className="text-lg font-extrabold tracking-tight">{modeloExibicao(moto)}</p>
                      <p className="text-micro text-textoFraco">
                        {[moto.ano ?? moto.catalogo_ano, formatarKm(km)].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <Rotulo>Saúde da manutenção</Rotulo>
                        <span className="text-sm font-bold tabular-nums" style={{ color: cor }}>
                          {saude.percentual === null ? 'sem dados' : `${saude.percentual}%`}
                        </span>
                      </div>
                      <Medidor
                        fracao={(saude.percentual ?? 0) / 100}
                        cor={cor}
                        rotulo={`Saúde de ${modeloExibicao(moto)}`}
                      />
                      <p className="text-micro text-textoFraco">{saude.rotulo}</p>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
