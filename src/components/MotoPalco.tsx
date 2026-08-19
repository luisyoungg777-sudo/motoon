import type { Moto } from '@/types'

/** Silhueta discreta — o placeholder do item 13, sem imagem de terceiro. */
export function SilhuetaMoto({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 150" className={className} aria-hidden focusable="false">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="66" cy="102" r="34" />
        <circle cx="234" cy="102" r="34" />
        <path d="M66 102 L120 88 L138 56" />
        <path d="M138 56 C152 40 186 40 198 56 L234 102" />
        <path d="M96 70 L138 56" />
        <path d="M198 52 L216 44" />
        <path d="M104 102 L176 96" />
      </g>
    </svg>
  )
}

export function marcaExibicao(moto: Moto): string {
  return (moto.catalogo_marca ?? moto.marca ?? '').trim()
}

export function modeloExibicao(moto: Moto): string {
  return (moto.catalogo_modelo ?? moto.modelo ?? moto.apelido ?? '').trim()
}

/**
 * O palco da moto. Com foto do usuário, ela é a protagonista. Sem foto, a
 * silhueta ocupa o espaço com dignidade em vez de virar retângulo cinza.
 */
export default function MotoPalco({
  moto,
  altura = 'h-32',
  arredondado = 'rounded-xl',
}: {
  moto: Moto
  altura?: string
  arredondado?: string
}) {
  const alt = `${marcaExibicao(moto)} ${modeloExibicao(moto)}`.trim() || moto.apelido

  return (
    <div className={`palco flex items-center justify-center ${altura} ${arredondado}`}>
      {moto.foto_url ? (
        <img
          src={moto.foto_url}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <SilhuetaMoto className="h-[78%] w-auto text-superficie3" />
      )}
    </div>
  )
}
