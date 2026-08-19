/**
 * Integração 9.1 — leitura de nota por IA. DESLIGADA.
 *
 * A arquitetura está pronta e o botão de câmera funciona (guarda a foto
 * junto ao registro), mas nenhuma chamada paga acontece. Para ligar no
 * futuro: preencher VITE_OCR_ENDPOINT no .env — a fábrica lá embaixo
 * passa a devolver o LeitorPorApi sozinha.
 *
 * Regra que não muda nunca: o resultado NÃO salva sozinho. Ele preenche
 * o formulário e o usuário confirma.
 */

export type DadosNota = {
  data?: string
  valor?: number
  local?: string
  itens?: string[]
  km?: number
}

export interface LeitorNota {
  disponivel(): boolean
  ler(imagem: File): Promise<DadosNota | null>
}

export const LeitorDesligado: LeitorNota = {
  disponivel: () => false,
  ler: async () => null,
}

class LeitorPorApi implements LeitorNota {
  constructor(
    private endpoint: string,
    private chave: string,
  ) {}

  disponivel(): boolean {
    return this.endpoint.length > 0
  }

  async ler(imagem: File): Promise<DadosNota | null> {
    const corpo = new FormData()
    corpo.append('imagem', imagem)

    try {
      const resposta = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.chave ? { Authorization: `Bearer ${this.chave}` } : undefined,
        body: corpo,
      })
      if (!resposta.ok) return null
      return (await resposta.json()) as DadosNota
    } catch {
      return null
    }
  }
}

export function obterLeitorNota(): LeitorNota {
  const endpoint = import.meta.env.VITE_OCR_ENDPOINT ?? ''
  const chave = import.meta.env.VITE_OCR_API_KEY ?? ''
  if (!endpoint) return LeitorDesligado
  return new LeitorPorApi(endpoint, chave)
}

/** Guarda a foto localmente como data URL — não sai do aparelho. */
export function fotoParaDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result))
    leitor.onerror = () => reject(new Error('não deu para ler a foto'))
    leitor.readAsDataURL(arquivo)
  })
}
