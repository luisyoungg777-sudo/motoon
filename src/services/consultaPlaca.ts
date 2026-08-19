/**
 * Integração 9.2 — consulta por placa. DESLIGADA.
 *
 * Enquanto isso, o cadastro usa o autocomplete local de src/data/motos-br.ts.
 * Para ligar: preencher VITE_PLACA_ENDPOINT no .env.
 */

export interface DadosPlaca {
  marca?: string
  modelo?: string
  ano?: number
}

export interface ConsultaPlaca {
  disponivel(): boolean
  consultar(placa: string): Promise<DadosPlaca | null>
}

export const ConsultaDesligada: ConsultaPlaca = {
  disponivel: () => false,
  consultar: async () => null,
}

class ConsultaPorApi implements ConsultaPlaca {
  constructor(
    private endpoint: string,
    private chave: string,
  ) {}

  disponivel(): boolean {
    return this.endpoint.length > 0
  }

  async consultar(placa: string): Promise<DadosPlaca | null> {
    try {
      const url = `${this.endpoint}?placa=${encodeURIComponent(placa)}`
      const resposta = await fetch(url, {
        headers: this.chave ? { Authorization: `Bearer ${this.chave}` } : undefined,
      })
      if (!resposta.ok) return null
      return (await resposta.json()) as DadosPlaca
    } catch {
      return null
    }
  }
}

export function obterConsultaPlaca(): ConsultaPlaca {
  const endpoint = import.meta.env.VITE_PLACA_ENDPOINT ?? ''
  const chave = import.meta.env.VITE_PLACA_API_KEY ?? ''
  if (!endpoint) return ConsultaDesligada
  return new ConsultaPorApi(endpoint, chave)
}
