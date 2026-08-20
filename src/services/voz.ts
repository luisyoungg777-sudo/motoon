/**
 * Web Speech API — gratuita e nativa. Se o aparelho não tiver (caso do
 * Safari/iOS em várias versões), `vozDisponivel()` devolve false e a
 * interface simplesmente esconde o microfone. Nunca mostrar erro técnico.
 */

interface ResultadoFala {
  isFinal: boolean
  0: { transcript: string }
}

interface EventoFala {
  resultIndex: number
  results: { length: number; [i: number]: ResultadoFala }
}

interface EventoErroFala {
  error: string
}

interface ReconhecimentoNativo {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: EventoFala) => void) | null
  onerror: ((e: EventoErroFala) => void) | null
  onend: (() => void) | null
}

type ConstrutorReconhecimento = new () => ReconhecimentoNativo

function construtor(): ConstrutorReconhecimento | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: ConstrutorReconhecimento
    webkitSpeechRecognition?: ConstrutorReconhecimento
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function vozDisponivel(): boolean {
  return construtor() !== null
}

export interface Escuta {
  parar(): void
}

export interface OpcoesEscuta {
  /** Texto reconhecido até agora, incluindo o parcial enquanto a pessoa fala. */
  aoOuvir(texto: string, definitivo: boolean): void
  aoTerminar(): void
  /** Chamado quando não deu (permissão negada, sem microfone). Sem jargão. */
  aoFalhar(motivo: string): void
}

export function escutar(opcoes: OpcoesEscuta): Escuta | null {
  const Ctor = construtor()
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = 'pt-BR'
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 1

  let acumulado = ''

  rec.onresult = (e) => {
    let parcial = ''
    let finalizado = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalizado += r[0].transcript
      else parcial += r[0].transcript
    }
    if (finalizado) acumulado += finalizado
    opcoes.aoOuvir((acumulado + parcial).trim(), finalizado.length > 0)
  }

  rec.onerror = (e) => {
    const motivo =
      e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'Precisa liberar o microfone para o DiasdMoto.'
        : e.error === 'no-speech'
          ? 'Não ouvi nada. Tenta de novo.'
          : 'Não consegui usar o microfone agora.'
    opcoes.aoFalhar(motivo)
  }

  rec.onend = () => opcoes.aoTerminar()

  try {
    rec.start()
  } catch {
    opcoes.aoFalhar('Não consegui usar o microfone agora.')
    return null
  }

  return {
    parar: () => {
      try {
        rec.stop()
      } catch {
        rec.abort()
      }
    },
  }
}
