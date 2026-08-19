import { formatarDinheiroCurto } from '@/services/formato'

export interface BarraMes {
  anoMes: string
  rotulo: string
  valor: number
}

/** SVG na mão — não vale instalar biblioteca de gráfico para 12 barras. */
export default function GraficoBarras({ barras }: { barras: BarraMes[] }) {
  const maior = Math.max(...barras.map((b) => b.valor), 1)
  const larguraBarra = 100 / barras.length

  return (
    <div className="painel p-3">
      <svg viewBox="0 0 100 44" className="h-32 w-full" role="img" aria-label="Gasto por mês">
        {barras.map((b, i) => {
          const altura = (b.valor / maior) * 34
          const x = i * larguraBarra
          return (
            <rect
              key={b.anoMes}
              x={x + larguraBarra * 0.18}
              y={36 - altura}
              width={larguraBarra * 0.64}
              height={Math.max(altura, b.valor > 0 ? 0.6 : 0)}
              rx="0.8"
              fill={i === barras.length - 1 ? 'rgb(var(--primary))' : 'rgb(var(--surface-3))'}
            />
          )
        })}
        {barras.map((b, i) => (
          <text
            key={`t-${b.anoMes}`}
            x={i * larguraBarra + larguraBarra / 2}
            y="42"
            textAnchor="middle"
            fontSize="3.2"
            fill="rgb(var(--text-muted))"
          >
            {b.rotulo}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-center text-xs text-apagado">
        maior mês: {formatarDinheiroCurto(maior)}
      </p>
    </div>
  )
}
