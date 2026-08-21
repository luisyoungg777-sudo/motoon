import { obterModelo } from '@/services/catalogoMotos'
import type { CategoriaMoto, Moto } from '@/types'

/**
 * Silhuetas por categoria.
 *
 * Por que desenho e não foto do fabricante: a decisão está no README, seção
 * "Imagens do catálogo". Hotlink apodrece, a imagem sumiria justo offline —
 * que é quando o app mais serve — e foto de catálogo é obra de terceiro, que
 * não se redistribui. `imagemUrl` continua vazio, e um teste trava isso.
 *
 * Mas havia um buraco real: até aqui existia UMA silhueta genérica para os
 * 114 modelos. Na lista do catálogo, uma Burgman, uma Hayabusa e uma V-Strom
 * desenhavam o mesmo contorno, então o desenho não ajudava a achar nada.
 *
 * Estas são construídas para se distinguirem no TAMANHO PEQUENO, que é onde
 * elas trabalham (32 px de altura na lista). Detalhe fino some nesse tamanho,
 * então o que separa uma da outra é a silhueta grossa: tamanho e distância
 * das rodas, altura do para-lama, presença de carenagem, e para onde a rabeta
 * aponta. Duas motos que o olho confunde de longe também se confundem aqui —
 * e tudo bem: o objetivo é estreitar a busca, não identificar a placa.
 */

const TRACO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** Roda comum, para as categorias não desenharem cada uma a sua. */
function Roda({ cx, cy = 104, r = 32 }: { cx: number; cy?: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} />
}

const DESENHOS: Record<CategoriaMoto, React.ReactNode> = {
  // Comuter de rua: postura ereta, tanque discreto, banco reto.
  street: (
    <>
      <Roda cx={66} />
      <Roda cx={234} />
      <path d="M66 104 L120 88 L138 58" />
      <path d="M138 58 C152 44 186 44 198 58 L234 104" />
      <path d="M96 72 L138 58" />
      <path d="M198 54 L218 46" />
      <path d="M104 102 L178 96" />
    </>
  ),

  // Naked: motor à mostra e guidão alto e largo. O bloco no meio é o que a
  // separa da street no tamanho pequeno.
  naked: (
    <>
      <Roda cx={66} />
      <Roda cx={234} />
      <path d="M66 104 L118 84 L136 52" />
      <path d="M136 52 C156 38 190 40 200 56 L234 104" />
      <path d="M120 108 L120 128 L166 128 L166 104" />
      <path d="M86 62 L136 52" />
      <path d="M200 50 L224 40" />
      <path d="M108 96 L182 90" />
    </>
  ),

  // Esportiva: carenagem descendo até quase o eixo dianteiro, bolha, e rabeta
  // subindo atrás. O nariz baixo e o rabo alto são a leitura.
  esportiva: (
    <>
      <Roda cx={70} />
      <Roda cx={232} />
      <path d="M70 104 C64 80 76 56 104 44" />
      <path d="M104 44 C114 32 128 30 138 36" />
      <path d="M104 44 C138 40 166 46 184 60" />
      <path d="M184 60 L220 44 L244 40" />
      <path d="M184 60 L232 104" />
      <path d="M118 86 L180 76" />
    </>
  ),

  // Scooter: guidão alto, escudo na frente das pernas, assoalho rebaixado e
  // rabeta bojuda por cima da roda. O assoalho baixo entre as duas rodas é o
  // que nenhuma outra categoria tem.
  scooter: (
    <>
      <Roda cx={72} cy={110} r={26} />
      <Roda cx={228} cy={110} r={26} />
      <path d="M72 110 L92 72 L106 46" />
      <path d="M98 42 L130 42" />
      <path d="M106 46 C86 66 80 88 84 104" />
      <path d="M84 104 L150 104" />
      <path d="M150 104 C168 104 174 92 178 80" />
      <path d="M160 78 L212 72" />
      <path d="M178 80 C200 70 218 78 228 94" />
    </>
  ),

  // Trail: roda grande, para-lama dianteiro alto e bem longe do pneu — o
  // vão entre os dois é a assinatura.
  trail: (
    <>
      <Roda cx={64} cy={100} r={38} />
      <Roda cx={236} cy={100} r={38} />
      <path d="M64 100 L106 74 L126 44" />
      <path d="M96 48 C74 54 60 62 52 72" />
      <path d="M126 44 C150 34 184 38 196 54 L236 100" />
      <path d="M92 60 L126 44" />
      <path d="M196 48 L222 38" />
      <path d="M110 88 L182 80" />
    </>
  ),

  // Adventure: o trail com bico, bolha e tanque grande. Fica mais alta e mais
  // "cheia" na frente.
  adventure: (
    <>
      <Roda cx={64} cy={100} r={38} />
      <Roda cx={236} cy={100} r={38} />
      <path d="M64 100 L104 72 L122 40" />
      <path d="M98 44 C76 50 60 60 50 72" />
      <path d="M104 30 C88 34 78 40 72 48" />
      <path d="M122 40 C152 28 188 34 200 52 L236 100" />
      <path d="M200 46 L224 36" />
      <path d="M112 86 L184 78" />
    </>
  ),

  // Off-road: sem farol e sem tanque cheio, banco fino e reto que sobe até a
  // traseira. Silhueta magra.
  'off-road': (
    <>
      <Roda cx={62} cy={98} r={40} />
      <Roda cx={238} cy={98} r={40} />
      <path d="M62 98 L104 68 L124 38" />
      <path d="M92 40 C72 46 58 54 48 64" />
      <path d="M124 38 L196 50 L238 98" />
      <path d="M100 80 L192 62" />
      <path d="M196 44 L220 34" />
    </>
  ),

  // Competição: o off-road com a placa de número na frente, que é o que a
  // separa dele de longe.
  racing: (
    <>
      <Roda cx={62} cy={98} r={40} />
      <Roda cx={238} cy={98} r={40} />
      <path d="M62 98 L104 68 L124 38" />
      <path d="M88 34 C72 40 60 50 52 62" />
      <path d="M124 38 L196 50 L238 98" />
      <path d="M100 80 L192 62" />
      <path d="M116 26 L146 26 L152 46 L122 46 Z" />
    </>
  ),

  // Touring: comprida e baixa, carenagem alta com bolha e malas atrás. É a
  // silhueta mais larga do conjunto.
  touring: (
    <>
      <Roda cx={66} cy={106} r={30} />
      <Roda cx={234} cy={106} r={30} />
      <path d="M66 106 C64 78 78 54 104 44" />
      <path d="M104 44 C96 30 100 22 110 18" />
      <path d="M104 44 C136 36 168 42 182 58" />
      <path d="M182 58 L234 106" />
      <path d="M196 62 L256 62 L256 96 L204 96" />
      <path d="M96 90 L178 82" />
    </>
  ),

  // Ciclomotor: pequeno em tudo. Rodas miúdas, quadro simples, bem baixo.
  ciclomotor: (
    <>
      <Roda cx={84} cy={114} r={22} />
      <Roda cx={216} cy={114} r={22} />
      <path d="M84 114 L104 84 L118 60" />
      <path d="M118 60 L146 60" />
      <path d="M110 82 L152 82 L146 110 L182 110" />
      <path d="M182 110 C204 110 214 102 216 92" />
      <path d="M152 82 L196 76 L216 92" />
    </>
  ),

  // Elétrica: corpo liso e sem escapamento. O raio é convenção de pictograma,
  // não enfeite — sem ele, ela e a scooter viram a mesma figura.
  eletrica: (
    <>
      <Roda cx={72} cy={110} r={26} />
      <Roda cx={228} cy={110} r={26} />
      <path d="M72 110 L94 78 L112 46" />
      <path d="M112 46 L144 46" />
      <path d="M98 72 L146 72 L138 108 L188 108" />
      <path d="M188 108 C214 108 226 96 228 84" />
      <path d="M154 86 C180 80 196 68 202 54 L228 84" />
      <path d="M170 96 L162 108 L176 108 L168 120" strokeWidth={4} />
    </>
  ),
}

/**
 * A silhueta. Sem categoria, cai na de rua — é a mais neutra, e é o que uma
 * moto cadastrada à mão, fora do catálogo, costuma ser.
 */
export function SilhuetaMoto({
  categoria,
  className = '',
}: {
  categoria?: CategoriaMoto
  className?: string
}) {
  return (
    <svg viewBox="0 0 300 150" className={className} aria-hidden focusable="false">
      <g {...TRACO}>{DESENHOS[categoria ?? 'street'] ?? DESENHOS.street}</g>
    </svg>
  )
}

export function marcaExibicao(moto: Moto): string {
  return (moto.catalogo_marca ?? moto.marca ?? '').trim()
}

/**
 * O nome que vai na tela. Modelo do catálogo com nome comercial comprido
 * ("Fazer FZ15 ABS Connected") aparece na forma curta. A consulta é pelo
 * catalogo_id, então moto cadastrada antes desta mudança também encurta,
 * sem precisar migrar nada.
 */
export function modeloExibicao(moto: Moto): string {
  if (moto.catalogo_id) {
    const doCatalogo = obterModelo(moto.catalogo_id)
    if (doCatalogo) return doCatalogo.nomeCurto ?? doCatalogo.modelo
  }
  return (moto.catalogo_modelo ?? moto.modelo ?? moto.apelido ?? '').trim()
}

/** Nome comercial completo — para o PDF e para a tela de detalhe. */
export function modeloCompleto(moto: Moto): string {
  return (moto.catalogo_modelo ?? moto.modelo ?? moto.apelido ?? '').trim()
}

/**
 * A categoria da moto para efeito de desenho. Vem do catálogo quando a moto
 * saiu de lá; moto cadastrada à mão não tem, e cai no padrão.
 */
export function categoriaDaMoto(moto: Moto): CategoriaMoto | undefined {
  if (moto.catalogo_categoria) return moto.catalogo_categoria
  if (moto.catalogo_id) return obterModelo(moto.catalogo_id)?.categoria
  return undefined
}

/**
 * O palco da moto. Com foto do usuário, ela é a protagonista. Sem foto, a
 * silhueta da categoria ocupa o espaço com dignidade em vez de virar
 * retângulo cinza.
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
        <SilhuetaMoto categoria={categoriaDaMoto(moto)} className="h-[78%] w-auto text-superficie3" />
      )}
    </div>
  )
}
