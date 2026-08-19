import { db, novoId } from './db'
import { agoraISO, hojeISO } from '@/services/datas'
import { CATALOGO_PADRAO } from '@/data/catalogo-padrao'
import {
  FATOR_PERFIL,
  type Abastecimento,
  type Despesa,
  type ItemManutencao,
  type LeituraOdometro,
  type Moto,
  type NomeTabela,
  type OperacaoSync,
  type PerfilUso,
  type RegistroBase,
  type Servico,
} from '@/types'

/** Toda escrita entra na fila; a Fase 4 é que vai drenar isso pro Supabase. */
async function enfileirar(tabela: NomeTabela, registro_id: string, operacao: OperacaoSync) {
  await db.sync_queue.add({
    tabela,
    registro_id,
    operacao,
    criado_em: agoraISO(),
    tentativas: 0,
  })
}

export function novoRegistro(): RegistroBase {
  return { id: novoId(), updated_at: agoraISO(), deleted_at: null }
}

async function gravar<T extends RegistroBase>(tabela: NomeTabela, registro: T): Promise<T> {
  const salvo = { ...registro, updated_at: agoraISO() }
  await db.table(tabela).put(salvo)
  await enfileirar(tabela, salvo.id, 'upsert')
  return salvo
}

export async function apagar(tabela: NomeTabela, id: string): Promise<void> {
  const atual = await db.table(tabela).get(id)
  if (!atual) return
  await db.table(tabela).put({ ...atual, deleted_at: agoraISO(), updated_at: agoraISO() })
  await enfileirar(tabela, id, 'delete')
}

function vivos<T extends RegistroBase>(lista: T[]): T[] {
  return lista.filter((r) => r.deleted_at === null)
}

// ---------------------------------------------------------------- motos

export function aplicarFator(valor: number | null, fator: number): number | null {
  if (valor === null) return null
  return Math.max(1, Math.round((valor * fator) / 5) * 5)
}

/** Cria a moto e, junto, o catálogo de manutenção já ajustado ao perfil de uso. */
export async function criarMoto(
  dados: Omit<Moto, keyof RegistroBase | 'criada_em' | 'arquivada'>,
): Promise<Moto> {
  const moto: Moto = {
    ...novoRegistro(),
    ...dados,
    criada_em: hojeISO(),
    arquivada: false,
  }
  await gravar('motos', moto)

  await criarCatalogoPadrao(moto.id, moto.perfil_uso)

  if (moto.km_inicial > 0) {
    await registrarLeitura(moto.id, moto.km_inicial, moto.criada_em, 'manual')
  }
  return moto
}

export async function salvarMoto(moto: Moto): Promise<Moto> {
  return gravar('motos', moto)
}

export async function listarMotos(): Promise<Moto[]> {
  return vivos(await db.motos.toArray()).filter((m) => !m.arquivada)
}

export async function obterMoto(id: string): Promise<Moto | undefined> {
  const m = await db.motos.get(id)
  return m && m.deleted_at === null ? m : undefined
}

// -------------------------------------------------- itens de manutenção

export async function criarCatalogoPadrao(moto_id: string, perfil: PerfilUso): Promise<void> {
  const fator = FATOR_PERFIL[perfil]
  for (const base of CATALOGO_PADRAO) {
    const item: ItemManutencao = {
      ...novoRegistro(),
      moto_id,
      nome: base.nome,
      categoria: base.categoria,
      intervalo_km: aplicarFator(base.intervalo_km, fator),
      intervalo_dias: aplicarFator(base.intervalo_dias, fator),
      ativo: true,
      observacao: base.observacao,
      fonte: 'padrao',
    }
    await gravar('itens_manutencao', item)
  }
}

/** Ao trocar o perfil de uso, só os itens ainda 'padrao' são recalculados. */
export async function recalcularItensPadrao(moto_id: string, perfil: PerfilUso): Promise<void> {
  const fator = FATOR_PERFIL[perfil]
  const itens = vivos(await db.itens_manutencao.where('moto_id').equals(moto_id).toArray())
  for (const item of itens) {
    if (item.fonte !== 'padrao') continue
    const base = CATALOGO_PADRAO.find((c) => c.nome === item.nome)
    if (!base) continue
    await gravar('itens_manutencao', {
      ...item,
      intervalo_km: aplicarFator(base.intervalo_km, fator),
      intervalo_dias: aplicarFator(base.intervalo_dias, fator),
    })
  }
}

export async function listarItens(moto_id: string): Promise<ItemManutencao[]> {
  return vivos(await db.itens_manutencao.where('moto_id').equals(moto_id).toArray())
}

/** Editar o intervalo é o gesto que promove o item de 'padrao' a valor confirmado. */
export async function salvarItem(item: ItemManutencao): Promise<ItemManutencao> {
  return gravar('itens_manutencao', item)
}

export async function criarItem(
  moto_id: string,
  dados: Omit<ItemManutencao, keyof RegistroBase | 'moto_id'>,
): Promise<ItemManutencao> {
  return gravar('itens_manutencao', { ...novoRegistro(), moto_id, ...dados })
}

// -------------------------------------------------------------- leituras

export async function registrarLeitura(
  moto_id: string,
  km: number,
  data: string,
  origem: LeituraOdometro['origem'],
): Promise<LeituraOdometro> {
  return gravar('leituras_odometro', { ...novoRegistro(), moto_id, km, data, origem })
}

export async function listarLeituras(moto_id: string): Promise<LeituraOdometro[]> {
  const lista = vivos(await db.leituras_odometro.where('moto_id').equals(moto_id).toArray())
  return lista.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.km - b.km))
}

// -------------------------------------------------------------- serviços

export async function salvarServico(servico: Servico, kmConfirmado = true): Promise<Servico> {
  const salvo = await gravar('servicos', servico)
  if (kmConfirmado && salvo.km !== null && salvo.km > 0) {
    await registrarLeitura(salvo.moto_id, salvo.km, salvo.data, 'servico')
  }
  return salvo
}

export async function listarServicos(moto_id: string): Promise<Servico[]> {
  return vivos(await db.servicos.where('moto_id').equals(moto_id).toArray())
}

// --------------------------------------------------------- abastecimentos

export async function salvarAbastecimento(
  a: Abastecimento,
  kmConfirmado = true,
): Promise<Abastecimento> {
  const valor_litro =
    a.valor_total !== null && a.litros !== null && a.litros > 0
      ? Number((a.valor_total / a.litros).toFixed(3))
      : a.valor_litro
  const salvo = await gravar('abastecimentos', { ...a, valor_litro })
  if (kmConfirmado && salvo.km !== null && salvo.km > 0) {
    await registrarLeitura(salvo.moto_id, salvo.km, salvo.data, 'abastecimento')
  }
  return salvo
}

export async function listarAbastecimentos(moto_id: string): Promise<Abastecimento[]> {
  return vivos(await db.abastecimentos.where('moto_id').equals(moto_id).toArray())
}

// -------------------------------------------------------------- despesas

export async function salvarDespesa(d: Despesa): Promise<Despesa> {
  return gravar('despesas', d)
}

export async function listarDespesas(moto_id: string): Promise<Despesa[]> {
  return vivos(await db.despesas.where('moto_id').equals(moto_id).toArray())
}

// ----------------------------------------------------------- preferências

export async function lerPreferencia(chave: string): Promise<string | null> {
  const p = await db.preferencias.get(chave)
  return p?.valor ?? null
}

export async function gravarPreferencia(chave: string, valor: string): Promise<void> {
  await db.preferencias.put({ chave, valor })
}
