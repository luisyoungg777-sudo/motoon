import { useEffect, type ReactNode } from 'react'
import { IcoAviso, IcoFechar } from './icones'

export function Folha({
  aberta,
  aoFechar,
  titulo,
  children,
}: {
  aberta: boolean
  aoFechar: () => void
  titulo: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!aberta) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', esc)
    }
  }, [aberta, aoFechar])

  if (!aberta) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="absolute inset-0 bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="folha relative max-h-[92vh] overflow-y-auto rounded-t-xl border-t border-linha bg-painel"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-linha bg-painel px-4 py-3">
          <h2 className="text-lg font-black tracking-tight">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-apagado active:bg-painel2"
          >
            <IcoFechar />
          </button>
        </div>
        <div className="safe-bottom px-4 pt-4">{children}</div>
      </div>
    </div>
  )
}

/** Bloco cinza pulsante no lugar do conteúdo — nunca uma tela branca. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulsar rounded-lg bg-superficie2 ${className}`}
    />
  )
}

export function Cartao({
  children,
  className = '',
  aoTocar,
  rotulo,
}: {
  children: ReactNode
  className?: string
  aoTocar?: () => void
  rotulo?: string
}) {
  const base = `rounded-xl border border-borda bg-superficie ${className}`
  if (!aoTocar) return <div className={base}>{children}</div>
  return (
    <button type="button" onClick={aoTocar} aria-label={rotulo} className={`${base} w-full text-left transition-colors hover:bg-superficie2`}>
      {children}
    </button>
  )
}

/** Rótulo curto em caixa alta — usado acima de todo número importante. */
export function Rotulo({ children }: { children: ReactNode }) {
  return <span className="block text-micro font-semibold uppercase text-textoFraco">{children}</span>
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs leading-snug text-amarelo/90">
      <IcoAviso className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export function Vazio({
  titulo,
  acao,
  aoAgir,
}: {
  titulo: string
  acao?: string
  aoAgir?: () => void
}) {
  return (
    <div className="painel flex flex-col items-center gap-3 px-4 py-8 text-center">
      <p className="text-sm text-apagado">{titulo}</p>
      {acao && aoAgir && (
        <button type="button" className="btn-laranja" onClick={aoAgir}>
          {acao}
        </button>
      )}
    </div>
  )
}

export function BarraProgresso({
  fracao,
  cor,
  rotulo,
}: {
  /** 0 = vencido, 1 = acabou de fazer. */
  fracao: number
  cor: string
  rotulo?: string
}) {
  const largura = Math.max(0, Math.min(1, fracao)) * 100
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(largura)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
      className="h-1.5 w-full overflow-hidden rounded-full bg-superficie3"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-saida"
        style={{ width: `${largura}%`, background: cor }}
      />
    </div>
  )
}

export function Selo({
  children,
  cor = 'apagado',
}: {
  children: ReactNode
  cor?: 'apagado' | 'laranja' | 'verde' | 'amarelo' | 'vermelho'
}) {
  const cores: Record<string, string> = {
    apagado: 'border-linha text-apagado',
    laranja: 'border-laranja/50 text-laranja',
    verde: 'border-verde/50 text-verde',
    amarelo: 'border-amarelo/50 text-amarelo',
    vermelho: 'border-vermelho/50 text-vermelho',
  }
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cores[cor]}`}
    >
      {children}
    </span>
  )
}

export function Campo({
  rotulo,
  children,
  dica,
}: {
  rotulo: string
  children: ReactNode
  dica?: string
}) {
  return (
    <label className="block">
      <span className="rotulo">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-apagado">{dica}</span>}
    </label>
  )
}

export function Alternador<T extends string>({
  opcoes,
  valor,
  aoTrocar,
}: {
  opcoes: { valor: T; rotulo: string }[]
  valor: T
  aoTrocar: (v: T) => void
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-linha bg-painel2 p-1">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => aoTrocar(o.valor)}
          className={`min-h-[40px] flex-1 rounded px-2 text-sm font-bold transition ${
            valor === o.valor ? 'bg-laranja text-black' : 'text-apagado active:bg-linha'
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}
