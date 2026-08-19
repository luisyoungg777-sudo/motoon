import { IcoFechar } from './icones'
import { Selo } from './ui'
import { formatarKm } from '@/services/formato'
import type { Rascunho } from '@/services/rascunho'
import type { CampoFaltando, Lancamento } from '@/services/parser'
import {
  ROTULO_CATEGORIA_DESPESA,
  ROTULO_COMBUSTIVEL,
  ROTULO_TIPO_LANCAMENTO,
  type CategoriaDespesa,
  type ItemManutencao,
  type TipoCombustivel,
  type TipoLancamento,
} from '@/types'

const TIPOS: TipoLancamento[] = ['servico', 'abastecimento', 'despesa']

function numeroParaTexto(n: number | null): string {
  if (n === null) return ''
  return String(n).replace('.', ',')
}

function textoParaNumero(t: string): number | null {
  const limpo = t.replace(/\./g, '').replace(',', '.').trim()
  if (limpo === '') return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

export default function CartaoLancamento({
  rascunho,
  itens,
  kmEstimado,
  aoMudar,
  aoRemover,
  compacto = false,
}: {
  rascunho: Rascunho
  itens: ItemManutencao[]
  kmEstimado: number | null
  aoMudar: (r: Rascunho) => void
  aoRemover?: () => void
  compacto?: boolean
}) {
  const l = rascunho.lancamento

  function mudar(patch: Partial<Lancamento>, confirmaKm = false) {
    aoMudar({
      ...rascunho,
      kmConfirmado: confirmaKm ? true : rascunho.kmConfirmado,
      lancamento: { ...l, ...patch },
    })
  }

  const falta = (c: CampoFaltando) => l.camposFaltando.includes(c)
  const destaque = (c: CampoFaltando) => (falta(c) ? 'border-amarelo ring-1 ring-amarelo' : '')

  return (
    <div className="painel space-y-3 p-3">
      {!compacto && (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm text-apagado">“{l.textoOriginal}”</p>
            {l.confianca !== 'alta' && (
              <div className="mt-1">
                <Selo cor="amarelo">confere aí</Selo>
              </div>
            )}
          </div>
          {aoRemover && (
            <button
              type="button"
              onClick={aoRemover}
              aria-label="Descartar este lançamento"
              className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-apagado active:bg-painel2"
            >
              <IcoFechar className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      <div className={`flex gap-1.5 ${falta('tipo') ? 'rounded-lg ring-1 ring-amarelo' : ''}`}>
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() =>
              mudar({
                tipo: t,
                camposFaltando: l.camposFaltando.filter((c) => c !== 'tipo'),
                tipoCombustivel: t === 'abastecimento' ? (l.tipoCombustivel ?? 'gasolina') : null,
              })
            }
            className={`min-h-[44px] flex-1 rounded-lg border px-2 text-xs font-black uppercase tracking-wide ${
              l.tipo === t ? 'border-laranja bg-laranja text-black' : 'border-linha bg-painel2 text-apagado'
            }`}
          >
            {ROTULO_TIPO_LANCAMENTO[t]}
          </button>
        ))}
      </div>

      {l.tipo === 'servico' && (
        <label className="block">
          <span className="rotulo">Item</span>
          <select
            className={`campo ${destaque('item')}`}
            value={l.itemNome ?? ''}
            onChange={(e) =>
              mudar({
                itemNome: e.target.value || null,
                camposFaltando: e.target.value
                  ? l.camposFaltando.filter((c) => c !== 'item')
                  : l.camposFaltando,
              })
            }
          >
            <option value="">Escolher o item…</option>
            {itens.map((i) => (
              <option key={i.id} value={i.nome}>
                {i.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      {l.tipo === 'despesa' && (
        <label className="block">
          <span className="rotulo">Categoria</span>
          <select
            className={`campo ${destaque('categoria')}`}
            value={l.categoriaDespesa ?? ''}
            onChange={(e) =>
              mudar({
                categoriaDespesa: (e.target.value || null) as CategoriaDespesa | null,
                camposFaltando: e.target.value
                  ? l.camposFaltando.filter((c) => c !== 'categoria')
                  : l.camposFaltando,
              })
            }
          >
            <option value="">Escolher a categoria…</option>
            {(Object.keys(ROTULO_CATEGORIA_DESPESA) as CategoriaDespesa[]).map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA_DESPESA[c]}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="rotulo">Valor (R$)</span>
          <input
            className={`campo ${destaque('valor')}`}
            inputMode="decimal"
            value={numeroParaTexto(l.valor)}
            placeholder={l.tipo === 'servico' ? 'opcional' : '0,00'}
            onChange={(e) =>
              mudar({
                valor: textoParaNumero(e.target.value),
                camposFaltando: l.camposFaltando.filter((c) => c !== 'valor'),
              })
            }
          />
        </label>

        <label className="block">
          <span className="rotulo">Data</span>
          <input
            type="date"
            className="campo"
            value={l.data}
            onChange={(e) => mudar({ data: e.target.value })}
          />
        </label>
      </div>

      {l.tipo === 'abastecimento' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="rotulo">Litros</span>
            <input
              className="campo"
              inputMode="decimal"
              value={numeroParaTexto(l.litros)}
              placeholder="opcional"
              onChange={(e) => mudar({ litros: textoParaNumero(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="rotulo">Combustível</span>
            <select
              className="campo"
              value={l.tipoCombustivel ?? 'gasolina'}
              onChange={(e) => mudar({ tipoCombustivel: e.target.value as TipoCombustivel })}
            >
              {(Object.keys(ROTULO_COMBUSTIVEL) as TipoCombustivel[]).map((c) => (
                <option key={c} value={c}>
                  {ROTULO_COMBUSTIVEL[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {(l.tipo === 'servico' || l.tipo === 'abastecimento') && (
        <div>
          <label className="block">
            <span className="rotulo">
              Km {!rascunho.kmConfirmado && l.km !== null && '(estimado — corrija se quiser)'}
            </span>
            <input
              className="campo"
              inputMode="numeric"
              value={l.km === null ? '' : String(l.km)}
              placeholder={kmEstimado === null ? 'km do painel' : formatarKm(kmEstimado)}
              onChange={(e) => {
                const bruto = e.target.value.replace(/\D/g, '')
                mudar({ km: bruto === '' ? null : Number(bruto) }, true)
              }}
            />
          </label>
        </div>
      )}

      {l.tipo === 'abastecimento' && (
        <label className="flex min-h-toque items-center gap-3">
          <input
            type="checkbox"
            className="h-6 w-6 accent-primaria"
            checked={l.tanqueCheio}
            onChange={(e) => mudar({ tanqueCheio: e.target.checked })}
          />
          <span className="text-sm">
            Enchi o tanque
            <span className="block text-xs text-apagado">É o que permite calcular o km/l.</span>
          </span>
        </label>
      )}

      {l.tipo === 'despesa' && (
        <label className="block">
          <span className="rotulo">Descrição</span>
          <input
            className="campo"
            value={l.descricao}
            placeholder="opcional"
            onChange={(e) => mudar({ descricao: e.target.value })}
          />
        </label>
      )}

      {l.numerosIgnorados.length > 0 && (
        <p className="text-xs text-amarelo">
          Não soube onde encaixar: {l.numerosIgnorados.join(', ')}. Confere os campos.
        </p>
      )}
    </div>
  )
}
