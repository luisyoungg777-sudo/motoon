import { useEffect, useRef, useState } from 'react'
import { Folha } from './ui'
import { IcoCamera } from './icones'
import CartaoLancamento from './CartaoLancamento'
import { rascunhoVazio, type Rascunho } from '@/services/rascunho'
import { salvarLancamento } from '@/services/salvarLancamento'
import { fotoParaDataUrl, obterLeitorNota } from '@/services/leitorNota'
import type { Vencimento } from '@/services/calculos'
import { ROTULO_TIPO_LANCAMENTO, type ItemManutencao, type Moto, type TipoLancamento } from '@/types'

const TIPOS: TipoLancamento[] = ['servico', 'abastecimento', 'despesa']

export default function FolhaRegistrar({
  aberta,
  aoFechar,
  moto,
  itens,
  vencimentos,
  kmEstimado,
  tipoInicial = 'servico',
}: {
  aberta: boolean
  aoFechar: () => void
  moto: Moto
  itens: ItemManutencao[]
  vencimentos: Vencimento[]
  kmEstimado: number | null
  /** Os atalhos da home abrem a folha já no tipo certo. */
  tipoInicial?: TipoLancamento
}) {
  const [tipo, setTipo] = useState<TipoLancamento>(tipoInicial)
  const [rascunho, setRascunho] = useState<Rascunho>(() => rascunhoVazio(tipoInicial, kmEstimado))
  const [detalhes, setDetalhes] = useState(false)
  const [local, setLocal] = useState('')
  const [observacao, setObservacao] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const entradaFoto = useRef<HTMLInputElement>(null)
  const leitor = obterLeitorNota()

  useEffect(() => {
    if (!aberta) return
    setTipo(tipoInicial)
    setRascunho(rascunhoVazio(tipoInicial, kmEstimado))
    setDetalhes(false)
    setLocal('')
    setObservacao('')
    setFoto(null)
  }, [aberta, kmEstimado, tipoInicial])

  function trocarTipo(t: TipoLancamento) {
    setTipo(t)
    setRascunho(rascunhoVazio(t, kmEstimado))
  }

  // Os que estão vencendo primeiro são os candidatos mais prováveis.
  const chips = vencimentos.slice(0, 6)

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return
    setFoto(await fotoParaDataUrl(arquivo))
    setDetalhes(true)
  }

  const pronto =
    rascunho.lancamento.tipo === 'servico'
      ? rascunho.lancamento.itemNome !== null
      : rascunho.lancamento.valor !== null

  async function salvar() {
    if (!pronto || salvando) return
    setSalvando(true)
    await salvarLancamento(rascunho.lancamento, {
      moto,
      itens,
      kmConfirmado: rascunho.kmConfirmado,
      extras: { local, observacao, foto_url: foto, posto: local },
    })
    setSalvando(false)
    aoFechar()
  }

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} titulo="Registrar">
      <div className="space-y-4 pb-4">
        <div className="flex gap-2">
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => trocarTipo(t)}
              className={`min-h-[56px] flex-1 rounded-lg border text-sm font-black uppercase tracking-wide ${
                tipo === t ? 'border-laranja bg-laranja text-black' : 'border-linha bg-painel2 text-apagado'
              }`}
            >
              {ROTULO_TIPO_LANCAMENTO[t]}
            </button>
          ))}
        </div>

        {tipo === 'servico' && chips.length > 0 && (
          <div>
            <p className="rotulo">O que você fez</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((v) => (
                <button
                  key={v.item.id}
                  type="button"
                  onClick={() =>
                    setRascunho({
                      ...rascunho,
                      lancamento: { ...rascunho.lancamento, itemNome: v.item.nome },
                    })
                  }
                  className={`chip ${rascunho.lancamento.itemNome === v.item.nome ? 'chip-ativo' : ''}`}
                >
                  {v.item.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <CartaoLancamento
          rascunho={rascunho}
          itens={itens}
          kmEstimado={kmEstimado}
          aoMudar={setRascunho}
          compacto
        />

        <div className="flex gap-2">
          <button
            type="button"
            className="btn-escuro flex-1"
            onClick={() => entradaFoto.current?.click()}
          >
            <IcoCamera className="h-5 w-5" />
            {foto ? 'Trocar foto' : 'Foto da nota'}
          </button>
          <button type="button" className="btn-fantasma" onClick={() => setDetalhes(!detalhes)}>
            {detalhes ? 'Menos detalhes' : 'Mais detalhes'}
          </button>
        </div>

        <input
          ref={entradaFoto}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => escolherFoto(e.target.files?.[0])}
        />

        {foto && (
          <div className="space-y-1">
            <img src={foto} alt="Foto da nota" className="max-h-48 w-full rounded-lg object-cover" />
            {!leitor.disponivel() && (
              <p className="text-xs text-apagado">
                A foto fica guardada junto com o registro. A leitura automática ainda está desligada.
              </p>
            )}
          </div>
        )}

        {detalhes && (
          <div className="space-y-3">
            <label className="block">
              <span className="rotulo">{tipo === 'abastecimento' ? 'Posto' : 'Local'}</span>
              <input
                className="campo"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder={tipo === 'abastecimento' ? 'Posto do Zé' : 'Oficina do Zé'}
              />
            </label>
            <label className="block">
              <span className="rotulo">Observação</span>
              <textarea
                className="campo"
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </label>
          </div>
        )}

        <button
          type="button"
          className="btn-laranja w-full text-lg"
          disabled={!pronto || salvando}
          onClick={salvar}
        >
          SALVAR
        </button>
        {!pronto && (
          <p className="text-center text-xs text-apagado">
            {tipo === 'servico' ? 'Escolhe o item acima.' : 'Falta o valor.'}
          </p>
        )}
      </div>
    </Folha>
  )
}
