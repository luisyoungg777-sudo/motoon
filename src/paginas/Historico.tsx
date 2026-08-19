import { useMemo, useState } from 'react'
import { Alternador, Folha, Selo, Vazio } from '@/components/ui'
import { IcoBusca, IcoLixeira } from '@/components/icones'
import { useMoto } from '@/estado'
import { apagar, salvarAbastecimento, salvarDespesa, salvarServico } from '@/db/repos'
import { formatarData, hojeISO, inicioDoAno, inicioDoMes } from '@/services/datas'
import { formatarDinheiro, formatarKm, formatarLitros, normalizar } from '@/services/formato'
import {
  ROTULO_CATEGORIA_DESPESA,
  ROTULO_COMBUSTIVEL,
  type Abastecimento,
  type Despesa,
  type NomeTabela,
  type Servico,
  type TipoLancamento,
} from '@/types'

type Registro = Servico | Abastecimento | Despesa

interface Evento {
  id: string
  tabela: NomeTabela
  tipo: TipoLancamento
  data: string
  titulo: string
  detalhe: string
  valor: number | null
  registro: Registro
}

type FiltroTipo = 'tudo' | TipoLancamento
type FiltroPeriodo = 'mes' | 'ano' | 'tudo'

const CORES_TIPO: Record<TipoLancamento, 'laranja' | 'verde' | 'apagado'> = {
  servico: 'laranja',
  abastecimento: 'verde',
  despesa: 'apagado',
}

const SIGLA_TIPO: Record<TipoLancamento, string> = {
  servico: 'serviço',
  abastecimento: 'abast.',
  despesa: 'despesa',
}

export default function Historico() {
  const { moto, servicos, abastecimentos, despesas } = useMoto()
  const [tipo, setTipo] = useState<FiltroTipo>('tudo')
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('tudo')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<Evento | null>(null)

  const eventos = useMemo<Evento[]>(() => {
    const lista: Evento[] = [
      ...servicos.map<Evento>((s) => ({
        id: s.id,
        tabela: 'servicos',
        tipo: 'servico',
        data: s.data,
        titulo: s.descricao || 'Serviço',
        detalhe: [s.km !== null ? formatarKm(s.km) : '', s.local].filter(Boolean).join(' · '),
        valor: s.valor,
        registro: s,
      })),
      ...abastecimentos.map<Evento>((a) => ({
        id: a.id,
        tabela: 'abastecimentos',
        tipo: 'abastecimento',
        data: a.data,
        titulo: ROTULO_COMBUSTIVEL[a.tipo_combustivel],
        detalhe: [
          a.litros !== null ? formatarLitros(a.litros) : '',
          a.km !== null ? formatarKm(a.km) : '',
          a.tanque_cheio ? 'tanque cheio' : '',
          a.posto,
        ]
          .filter(Boolean)
          .join(' · '),
        valor: a.valor_total,
        registro: a,
      })),
      ...despesas.map<Evento>((d) => ({
        id: d.id,
        tabela: 'despesas',
        tipo: 'despesa',
        data: d.data,
        titulo: ROTULO_CATEGORIA_DESPESA[d.categoria],
        detalhe: d.descricao,
        valor: d.valor,
        registro: d,
      })),
    ]

    const hoje = hojeISO()
    const de = periodo === 'mes' ? inicioDoMes(hoje) : periodo === 'ano' ? inicioDoAno(hoje) : null
    const alvo = normalizar(busca)

    return lista
      .filter((e) => (tipo === 'tudo' ? true : e.tipo === tipo))
      .filter((e) => (de === null ? true : e.data >= de))
      .filter((e) => (alvo === '' ? true : normalizar(`${e.titulo} ${e.detalhe}`).includes(alvo)))
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  }, [servicos, abastecimentos, despesas, tipo, periodo, busca])

  if (!moto) return null

  return (
    <div className="space-y-4 px-4 pt-4">
      <h1 className="text-2xl font-black tracking-tight">Histórico</h1>

      <div className="relative">
        <IcoBusca className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-apagado" />
        <input
          className="campo pl-10"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar"
          aria-label="Buscar no histórico"
        />
      </div>

      <Alternador
        opcoes={[
          { valor: 'tudo', rotulo: 'Tudo' },
          { valor: 'servico', rotulo: 'Serviço' },
          { valor: 'abastecimento', rotulo: 'Abast.' },
          { valor: 'despesa', rotulo: 'Despesa' },
        ]}
        valor={tipo}
        aoTrocar={setTipo}
      />

      <Alternador
        opcoes={[
          { valor: 'mes', rotulo: 'Este mês' },
          { valor: 'ano', rotulo: 'Este ano' },
          { valor: 'tudo', rotulo: 'Tudo' },
        ]}
        valor={periodo}
        aoTrocar={setPeriodo}
      />

      {eventos.length === 0 ? (
        <Vazio titulo="Nada registrado nesse recorte ainda." />
      ) : (
        <ul className="space-y-2">
          {eventos.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setAberto(e)}
                className="painel flex w-full items-center gap-3 p-3 text-left active:bg-painel2"
              >
                <div className="w-14 shrink-0 text-center">
                  <span className="block text-xs text-apagado">{formatarData(e.data).slice(0, 5)}</span>
                  <span className="block text-[10px] text-apagado">{e.data.slice(0, 4)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{e.titulo}</p>
                  <p className="truncate text-xs text-apagado">{e.detalhe || '—'}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-black">{formatarDinheiro(e.valor)}</p>
                  <Selo cor={CORES_TIPO[e.tipo]}>{SIGLA_TIPO[e.tipo]}</Selo>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && <FolhaDetalhe evento={aberto} aoFechar={() => setAberto(null)} />}
    </div>
  )
}

function FolhaDetalhe({ evento, aoFechar }: { evento: Evento; aoFechar: () => void }) {
  const [registro, setRegistro] = useState<Registro>(evento.registro)
  const [confirmando, setConfirmando] = useState(false)

  function campoNumero(v: number | null): string {
    return v === null ? '' : String(v).replace('.', ',')
  }

  function paraNumero(t: string): number | null {
    const limpo = t.replace(/\./g, '').replace(',', '.').trim()
    if (limpo === '') return null
    const n = Number(limpo)
    return Number.isFinite(n) ? n : null
  }

  async function salvar() {
    if (evento.tipo === 'servico') await salvarServico(registro as Servico, false)
    else if (evento.tipo === 'abastecimento') await salvarAbastecimento(registro as Abastecimento, false)
    else await salvarDespesa(registro as Despesa)
    aoFechar()
  }

  async function remover() {
    await apagar(evento.tabela, evento.id)
    aoFechar()
  }

  const servico = evento.tipo === 'servico' ? (registro as Servico) : null
  const abast = evento.tipo === 'abastecimento' ? (registro as Abastecimento) : null
  const despesa = evento.tipo === 'despesa' ? (registro as Despesa) : null

  return (
    <Folha aberta aoFechar={aoFechar} titulo={evento.titulo}>
      <div className="space-y-3 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="rotulo">Data</span>
            <input
              type="date"
              className="campo"
              value={registro.data}
              onChange={(e) => setRegistro({ ...registro, data: e.target.value } as Registro)}
            />
          </label>
          <label className="block">
            <span className="rotulo">Valor (R$)</span>
            <input
              className="campo"
              inputMode="decimal"
              value={campoNumero(abast ? abast.valor_total : servico ? servico.valor : despesa!.valor)}
              onChange={(e) => {
                const v = paraNumero(e.target.value)
                if (abast) setRegistro({ ...abast, valor_total: v })
                else if (servico) setRegistro({ ...servico, valor: v })
                else setRegistro({ ...despesa!, valor: v })
              }}
            />
          </label>
        </div>

        {(servico || abast) && (
          <label className="block">
            <span className="rotulo">Km</span>
            <input
              className="campo"
              inputMode="numeric"
              value={(servico ?? abast)!.km ?? ''}
              onChange={(e) => {
                const bruto = e.target.value.replace(/\D/g, '')
                const km = bruto === '' ? null : Number(bruto)
                if (servico) setRegistro({ ...servico, km })
                else setRegistro({ ...abast!, km })
              }}
            />
          </label>
        )}

        {abast && (
          <label className="block">
            <span className="rotulo">Litros</span>
            <input
              className="campo"
              inputMode="decimal"
              value={campoNumero(abast.litros)}
              onChange={(e) => setRegistro({ ...abast, litros: paraNumero(e.target.value) })}
            />
          </label>
        )}

        {servico && (
          <label className="block">
            <span className="rotulo">Local</span>
            <input
              className="campo"
              value={servico.local}
              onChange={(e) => setRegistro({ ...servico, local: e.target.value })}
            />
          </label>
        )}

        {despesa && (
          <label className="block">
            <span className="rotulo">Descrição</span>
            <input
              className="campo"
              value={despesa.descricao}
              onChange={(e) => setRegistro({ ...despesa, descricao: e.target.value })}
            />
          </label>
        )}

        {servico?.foto_url && (
          <img src={servico.foto_url} alt="Foto da nota" className="w-full rounded-lg" />
        )}

        <button type="button" className="btn-laranja w-full text-lg" onClick={salvar}>
          SALVAR
        </button>

        {confirmando ? (
          <div className="painel space-y-2 p-3">
            <p className="text-sm">Apagar este registro de vez?</p>
            <div className="flex gap-2">
              <button type="button" className="btn-escuro flex-1" onClick={() => setConfirmando(false)}>
                Não
              </button>
              <button
                type="button"
                className="btn flex-1 bg-vermelho font-bold text-white"
                onClick={remover}
              >
                Apagar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-fantasma w-full text-vermelho"
            onClick={() => setConfirmando(true)}
          >
            <IcoLixeira className="h-5 w-5" />
            Apagar
          </button>
        )}
      </div>
    </Folha>
  )
}
