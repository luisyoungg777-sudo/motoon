import { useRef, useState } from 'react'
import { IcoMicrofone } from './icones'
import CartaoLancamento from './CartaoLancamento'
import { parseTexto } from '@/services/parser'
import { criarRascunho, type Rascunho } from '@/services/rascunho'
import { salvarLancamento } from '@/services/salvarLancamento'
import { escutar, vozDisponivel, type Escuta } from '@/services/voz'
import type { ItemManutencao, Moto } from '@/types'

export default function CaixaFrase({
  moto,
  itens,
  kmEstimado,
}: {
  moto: Moto
  itens: ItemManutencao[]
  kmEstimado: number | null
}) {
  const [texto, setTexto] = useState('')
  const [rascunhos, setRascunhos] = useState<Rascunho[] | null>(null)
  const [escutando, setEscutando] = useState(false)
  const [recado, setRecado] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const escuta = useRef<Escuta | null>(null)
  const temVoz = vozDisponivel()

  function entender(entrada: string) {
    const lancamentos = parseTexto(entrada)
    if (lancamentos.length === 0) return
    setRascunhos(lancamentos.map((l) => criarRascunho(l, kmEstimado)))
    setRecado(null)
  }

  function alternarMicrofone() {
    if (escutando) {
      escuta.current?.parar()
      return
    }
    setRecado(null)
    setEscutando(true)
    escuta.current = escutar({
      aoOuvir: (ouvido, definitivo) => {
        setTexto(ouvido)
        if (definitivo) entender(ouvido)
      },
      aoTerminar: () => {
        setEscutando(false)
        escuta.current = null
      },
      aoFalhar: (motivo) => {
        setRecado(motivo)
        setEscutando(false)
      },
    })
    if (!escuta.current) setEscutando(false)
  }

  async function salvarTudo() {
    if (!rascunhos || salvando) return
    const prontos = rascunhos.filter((r) => r.lancamento.tipo !== null)
    if (prontos.length === 0) return

    setSalvando(true)
    for (const r of prontos) {
      await salvarLancamento(r.lancamento, { moto, itens, kmConfirmado: r.kmConfirmado })
    }
    setSalvando(false)
    setRascunhos(null)
    setTexto('')
    setRecado(prontos.length === 1 ? 'Registrado.' : `${prontos.length} lançamentos registrados.`)
  }

  const faltaTipo = rascunhos?.some((r) => r.lancamento.tipo === null) ?? false

  return (
    <section className="space-y-3">
      <div className="flex gap-2">
        <textarea
          rows={1}
          className="campo resize-none py-3"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              entender(texto)
            }
          }}
          placeholder="gasolina 50"
          aria-label="Escreva o que aconteceu"
          enterKeyHint="done"
        />
        {temVoz && (
          <button
            type="button"
            onClick={alternarMicrofone}
            aria-label={escutando ? 'Parar de gravar' : 'Falar'}
            aria-pressed={escutando}
            className={`flex min-h-toque min-w-toque items-center justify-center rounded-lg border transition ${
              escutando
                ? 'animate-pulse border-laranja bg-laranja text-black'
                : 'border-linha bg-painel2 text-texto'
            }`}
          >
            <IcoMicrofone />
          </button>
        )}
      </div>

      {escutando && <p className="text-xs font-bold text-laranja">Ouvindo… pode falar.</p>}

      {texto.trim().length > 0 && rascunhos === null && (
        <button type="button" className="btn-laranja w-full" onClick={() => entender(texto)}>
          ENTENDER
        </button>
      )}

      {recado && <p className="text-sm text-apagado">{recado}</p>}

      {rascunhos && rascunhos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-apagado">
            {rascunhos.length === 1 ? 'Confere e salva' : `${rascunhos.length} lançamentos — confere e salva`}
          </p>

          {rascunhos.map((r, i) => (
            <CartaoLancamento
              key={r.chave}
              rascunho={r}
              itens={itens}
              kmEstimado={kmEstimado}
              aoMudar={(novo) => setRascunhos(rascunhos.map((x, j) => (j === i ? novo : x)))}
              aoRemover={() => {
                const restantes = rascunhos.filter((_, j) => j !== i)
                setRascunhos(restantes.length > 0 ? restantes : null)
              }}
            />
          ))}

          {faltaTipo && (
            <p className="text-xs text-amarelo">
              Escolhe o tipo do que está em amarelo — não vou adivinhar.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              className="btn-escuro"
              onClick={() => {
                setRascunhos(null)
                setTexto('')
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-laranja flex-1 text-lg"
              disabled={faltaTipo || salvando}
              onClick={salvarTudo}
            >
              SALVAR{rascunhos.length > 1 ? ` (${rascunhos.length})` : ''}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
