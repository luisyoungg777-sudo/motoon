/** Datas são guardadas como 'aaaa-mm-dd' (dia local, sem fuso). */

export function paraISO(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Constrói Date no fuso local — `new Date('2026-08-19')` cairia em UTC e podia voltar um dia. */
export function deISO(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1)
}

export function hojeISO(hoje: Date = new Date()): string {
  return paraISO(hoje)
}

export function agoraISO(): string {
  return new Date().toISOString()
}

export function somarDias(iso: string, dias: number): string {
  const d = deISO(iso)
  d.setDate(d.getDate() + dias)
  return paraISO(d)
}

/** Dias inteiros de `a` até `b`. Positivo se `b` for depois de `a`. */
export function diasEntre(a: string, b: string): number {
  const ms = deISO(b).getTime() - deISO(a).getTime()
  return Math.round(ms / 86_400_000)
}

export function formatarData(iso: string): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * A exceção do arquivo: um instante, não um dia.
 *
 * A marca d'água da sincronização é um carimbo com fuso — vem do Postgres
 * como `2026-08-20T14:03:11.123456+00:00`, sempre em UTC. Fatiar essa string
 * mostraria 14:03 para quem sincronizou às 11:03 em Brasília, então aqui ela
 * passa por Date e volta no fuso de quem está lendo.
 */
export function formatarInstante(iso: string | null | undefined): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return '—'

  const d = new Date(t)
  const hora = String(d.getHours()).padStart(2, '0')
  const minuto = String(d.getMinutes()).padStart(2, '0')
  return `${formatarData(paraISO(d))} às ${hora}:${minuto}`
}

export function formatarDataCurta(iso: string): string {
  if (!iso) return '—'
  const [, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}`
}

export function inicioDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

export function inicioDoAno(iso: string): string {
  return `${iso.slice(0, 4)}-01-01`
}

export function mesAnterior(anoMes: string): string {
  const [ano, mes] = anoMes.split('-').map(Number)
  const d = new Date(ano, mes - 1, 1)
  d.setMonth(d.getMonth() - 1)
  return paraISO(d).slice(0, 7)
}

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export function rotuloMes(anoMes: string): string {
  const [, mes] = anoMes.split('-').map(Number)
  return MESES_CURTOS[mes - 1] ?? '—'
}

/** Descrição humana de um prazo: 'faltam 12 dias', 'venceu há 3 dias', 'vence hoje'. */
export function textoDias(dias: number): string {
  if (dias === 0) return 'vence hoje'
  if (dias > 0) return `faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const atraso = Math.abs(dias)
  return `venceu há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}`
}
