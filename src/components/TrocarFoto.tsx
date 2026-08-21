import { useRef, useState } from 'react'
import { IcoCamera } from './icones'
import { modeloExibicao } from './MotoPalco'
import { salvarMoto } from '@/db/repos'
import { prepararFoto } from '@/services/foto'
import type { Moto } from '@/types'

/**
 * O selo de câmera que fica por cima da foto da moto.
 *
 * Existe porque pôr a foto só pelo formulário de cadastro é longe demais:
 * eram quatro toques a partir da garagem, e ninguém descobre sozinho que a
 * opção está lá dentro. Aqui a foto se troca de onde ela é vista.
 *
 * Salva na hora, sem passar por formulário nem por botão de confirmar. É uma
 * escolha: trocar a foto é reversível e sem consequência — a anterior não
 * está em lugar nenhum que a pessoa fosse consultar —, e pedir confirmação
 * para isso seria cerimônia sem ganho.
 *
 * Fica FORA do cartão da garagem, posicionado por cima, e não dentro dele: o
 * cartão inteiro é um `<button>` que leva ao painel da moto, e botão dentro
 * de botão é HTML inválido e clique que se atropela.
 */
export function TrocarFoto({ moto, className = '' }: { moto: Moto; className?: string }) {
  const entrada = useRef<HTMLInputElement>(null)
  const [ocupado, setOcupado] = useState(false)

  async function escolher(arquivo?: File) {
    if (!arquivo) return
    setOcupado(true)
    try {
      // Reduz antes de guardar: a foto vira texto dentro do registro e sobe
      // junto na sincronização. Ver src/services/foto.ts.
      const foto = await prepararFoto(arquivo)
      await salvarMoto({ ...moto, foto_url: foto })
    } finally {
      setOcupado(false)
      // Permite reescolher o MESMO arquivo depois: sem isto, o input não
      // dispara `change` na segunda vez e o botão parece morto.
      if (entrada.current) entrada.current.value = ''
    }
  }

  const nome = modeloExibicao(moto) || moto.apelido
  const rotulo = moto.foto_url ? `Trocar a foto de ${nome}` : `Adicionar foto de ${nome}`

  return (
    <>
      <button
        type="button"
        aria-label={rotulo}
        title={rotulo}
        disabled={ocupado}
        onClick={() => entrada.current?.click()}
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-texto backdrop-blur-sm transition-colors hover:bg-black/75 disabled:opacity-60 ${className}`}
      >
        <IcoCamera className={`h-[18px] w-[18px] ${ocupado ? 'animate-pulsar' : ''}`} />
      </button>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={rotulo}
        onChange={(e) => escolher(e.target.files?.[0])}
      />
    </>
  )
}
