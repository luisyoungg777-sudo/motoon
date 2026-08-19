const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

const NUMERO = new Intl.NumberFormat('pt-BR')

export function formatarDinheiro(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—'
  return MOEDA.format(valor)
}

/** Sem centavos — para totais grandes em cartão. */
export function formatarDinheiroCurto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—'
  return `R$ ${NUMERO.format(Math.round(valor))}`
}

export function formatarKm(km: number | null | undefined): string {
  if (km === null || km === undefined || Number.isNaN(km)) return '—'
  return `${NUMERO.format(Math.round(km))} km`
}

export function formatarNumero(n: number, casas = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(n)
}

export function formatarLitros(l: number | null | undefined): string {
  if (l === null || l === undefined || Number.isNaN(l)) return '—'
  return `${formatarNumero(l, 2)} L`
}

export function formatarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Tira acento e caixa — base de toda comparação de texto do parser. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
