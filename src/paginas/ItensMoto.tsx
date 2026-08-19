import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Aviso, Folha, Selo } from '@/components/ui'
import { IcoMais, IcoVoltar } from '@/components/icones'
import { useMoto } from '@/estado'
import { criarItem, salvarItem } from '@/db/repos'
import { formatarKm } from '@/services/formato'
import {
  ROTULO_CATEGORIA_ITEM,
  type CategoriaItem,
  type ItemManutencao,
} from '@/types'

const CATEGORIAS = Object.keys(ROTULO_CATEGORIA_ITEM) as CategoriaItem[]

function descreverIntervalo(item: ItemManutencao): string {
  const partes: string[] = []
  if (item.intervalo_km) partes.push(`a cada ${formatarKm(item.intervalo_km)}`)
  if (item.intervalo_dias) partes.push(`ou ${item.intervalo_dias} dias`)
  return partes.length > 0 ? partes.join(' ') : 'sem intervalo definido'
}

export default function ItensMoto() {
  const { moto, itens } = useMoto()
  const navegar = useNavigate()
  const [editando, setEditando] = useState<ItemManutencao | null>(null)
  const [criando, setCriando] = useState(false)

  if (!moto) return null

  const aindaPadrao = itens.filter((i) => i.fonte === 'padrao').length

  return (
    <div className="space-y-5 px-4 pb-8 pt-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navegar(-1)}
          aria-label="Voltar"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-apagado active:bg-painel2"
        >
          <IcoVoltar />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Itens de manutenção</h1>
          <p className="text-xs text-apagado">{moto.apelido}</p>
        </div>
      </header>

      {aindaPadrao > 0 && (
        <div className="painel p-3">
          <Aviso>
            {aindaPadrao} {aindaPadrao === 1 ? 'item ainda usa' : 'itens ainda usam'} valor genérico de
            uso urbano. Abra o manual da sua moto e ajuste — depois de editar, o aviso some.
          </Aviso>
        </div>
      )}

      {CATEGORIAS.map((cat) => {
        const daCategoria = itens.filter((i) => i.categoria === cat)
        if (daCategoria.length === 0) return null
        return (
          <section key={cat} className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-apagado">
              {ROTULO_CATEGORIA_ITEM[cat]}
            </h2>
            <ul className="space-y-2">
              {daCategoria.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setEditando(i)}
                    className={`painel flex w-full items-center gap-3 p-3 text-left active:bg-painel2 ${
                      i.ativo ? '' : 'opacity-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{i.nome}</p>
                      <p className="text-xs text-apagado">{descreverIntervalo(i)}</p>
                      {i.observacao && <p className="text-xs text-apagado">{i.observacao}</p>}
                    </div>
                    {i.fonte === 'padrao' ? (
                      <Selo cor="amarelo">genérico</Selo>
                    ) : (
                      <Selo cor="verde">confirmado</Selo>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <button type="button" className="btn-escuro w-full" onClick={() => setCriando(true)}>
        <IcoMais className="h-5 w-5" />
        Adicionar item
      </button>

      {editando && (
        <FolhaItem
          item={editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={async (i) => {
            await salvarItem(i)
            setEditando(null)
          }}
        />
      )}

      {criando && (
        <FolhaItem
          item={{
            id: '',
            updated_at: '',
            deleted_at: null,
            moto_id: moto.id,
            nome: '',
            categoria: 'geral',
            intervalo_km: null,
            intervalo_dias: null,
            ativo: true,
            observacao: '',
            fonte: 'usuario',
          }}
          novo
          aoFechar={() => setCriando(false)}
          aoSalvar={async (i) => {
            await criarItem(moto.id, {
              nome: i.nome,
              categoria: i.categoria,
              intervalo_km: i.intervalo_km,
              intervalo_dias: i.intervalo_dias,
              ativo: i.ativo,
              observacao: i.observacao,
              fonte: 'usuario',
            })
            setCriando(false)
          }}
        />
      )}
    </div>
  )
}

function FolhaItem({
  item,
  novo = false,
  aoFechar,
  aoSalvar,
}: {
  item: ItemManutencao
  novo?: boolean
  aoFechar: () => void
  aoSalvar: (i: ItemManutencao) => Promise<void>
}) {
  const [rascunho, setRascunho] = useState(item)

  function numero(t: string): number | null {
    const limpo = t.replace(/\D/g, '')
    return limpo === '' ? null : Number(limpo)
  }

  const mudouIntervalo =
    rascunho.intervalo_km !== item.intervalo_km || rascunho.intervalo_dias !== item.intervalo_dias

  return (
    <Folha aberta aoFechar={aoFechar} titulo={novo ? 'Novo item' : item.nome}>
      <div className="space-y-3 pb-4">
        {novo && (
          <label className="block">
            <span className="rotulo">Nome</span>
            <input
              className="campo"
              value={rascunho.nome}
              onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
              placeholder="Ex.: Rolamento de roda"
            />
          </label>
        )}

        <label className="block">
          <span className="rotulo">Categoria</span>
          <select
            className="campo"
            value={rascunho.categoria}
            onChange={(e) => setRascunho({ ...rascunho, categoria: e.target.value as CategoriaItem })}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA_ITEM[c]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="rotulo">A cada (km)</span>
            <input
              className="campo"
              inputMode="numeric"
              value={rascunho.intervalo_km ?? ''}
              placeholder="—"
              onChange={(e) => setRascunho({ ...rascunho, intervalo_km: numero(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="rotulo">Ou a cada (dias)</span>
            <input
              className="campo"
              inputMode="numeric"
              value={rascunho.intervalo_dias ?? ''}
              placeholder="—"
              onChange={(e) => setRascunho({ ...rascunho, intervalo_dias: numero(e.target.value) })}
            />
          </label>
        </div>

        <label className="block">
          <span className="rotulo">Observação</span>
          <input
            className="campo"
            value={rascunho.observacao}
            onChange={(e) => setRascunho({ ...rascunho, observacao: e.target.value })}
          />
        </label>

        <label className="flex min-h-toque items-center gap-3">
          <input
            type="checkbox"
            className="h-6 w-6 accent-[color:var(--laranja)]"
            checked={rascunho.ativo}
            onChange={(e) => setRascunho({ ...rascunho, ativo: e.target.checked })}
          />
          <span className="text-sm">Acompanhar este item</span>
        </label>

        {item.fonte === 'padrao' && !mudouIntervalo && (
          <Aviso>
            Este intervalo é valor genérico — confirme no manual da sua moto. Ao editar e salvar, ele
            passa a valer como o número do seu manual.
          </Aviso>
        )}

        <button
          type="button"
          className="btn-laranja w-full text-lg"
          disabled={rascunho.nome.trim().length === 0}
          onClick={() =>
            aoSalvar({
              ...rascunho,
              fonte: mudouIntervalo && rascunho.fonte === 'padrao' ? 'manual_fabricante' : rascunho.fonte,
            })
          }
        >
          SALVAR
        </button>
      </div>
    </Folha>
  )
}
