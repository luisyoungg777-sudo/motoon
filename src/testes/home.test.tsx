import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { montar } from './ajuda'
import Home from '@/paginas/Home'
import Garagem from '@/paginas/Garagem'
import { db } from '@/db/db'
import { criarMoto, salvarServico } from '@/db/repos'
import { novoRegistro } from '@/db/repos'
import { hojeISO, somarDias } from '@/services/datas'
import type { Moto } from '@/types'

async function moto(apelido = 'Fanzoca'): Promise<Moto> {
  const m = await criarMoto({
    apelido,
    marca: 'Honda',
    modelo: 'CG 160 Titan',
    ano: 2026,
    placa: 'ABC1D23',
    cor: 'Preta',
    km_inicial: 12480,
    foto_url: null,
    perfil_uso: 'urbano_leve',
    catalogo_id: 'honda-cg-160-titan',
    catalogo_marca: 'Honda',
    catalogo_modelo: 'CG 160 Titan',
    catalogo_categoria: 'street',
  })
  await waitFor(async () => expect(await db.itens_manutencao.count()).toBe(16))
  return m
}

describe('Home', () => {
  it('mostra a moto do catálogo e o km como número principal', async () => {
    await moto()
    montar(<Home />)

    expect(await screen.findByText('CG 160 Titan')).toBeInTheDocument()
    expect(screen.getByText('Honda')).toBeInTheDocument()
    expect(screen.getByText(/12\.480/)).toBeInTheDocument()
  })

  it('lista o que está vencendo, com o prazo mais curto na frente', async () => {
    await moto()
    montar(<Home />)

    const lista = await screen.findByRole('list')
    const itens = within(lista).getAllByRole('listitem')

    // Moto nova: tudo empatado em 100%, então o desempate por prazo manda.
    // Calibragem (7 dias) vem antes de qualquer item só por km.
    expect(itens[0]).toHaveTextContent('Calibragem dos pneus')
  })

  it('não mostra saudação com nome quando não há conta', async () => {
    await moto()
    montar(<Home />)

    await screen.findByText('CG 160 Titan')
    expect(screen.queryByText(/^Olá,/)).not.toBeInTheDocument()
  })

  it('registrar por frase cria o lançamento e some com o cartão', async () => {
    const u = userEvent.setup()
    await moto()
    montar(<Home />)

    const campo = await screen.findByLabelText('Escreva o que aconteceu')
    await u.type(campo, 'gasolina 50 12800 km')
    await u.click(screen.getByRole('button', { name: 'ENTENDER' }))

    // O parser preencheu o cartão de confirmação.
    expect(await screen.findByDisplayValue('50')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12800')).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: /^SALVAR$/ }))

    await waitFor(async () => expect(await db.abastecimentos.count()).toBe(1))

    const a = (await db.abastecimentos.toArray())[0]
    expect(a.valor_total).toBe(50)
    expect(a.km).toBe(12800)
    // Km digitado vira leitura de odômetro.
    const leituras = await db.leituras_odometro.toArray()
    expect(leituras.some((l) => l.km === 12800 && l.origem === 'abastecimento')).toBe(true)
  })

  it('três linhas viram três lançamentos numa confirmação só', async () => {
    const u = userEvent.setup()
    await moto()
    montar(<Home />)

    const campo = await screen.findByLabelText('Escreva o que aconteceu')
    // O textarea trata Enter como "entender", então as quebras vão via paste.
    await u.click(campo)
    await u.paste('gasolina 50\npedagio 10\nlavagem 25')
    await u.click(screen.getByRole('button', { name: 'ENTENDER' }))

    expect(await screen.findByText(/3 lançamentos/)).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: /SALVAR \(3\)/ }))

    await waitFor(async () => {
      expect(await db.abastecimentos.count()).toBe(1)
      expect(await db.despesas.count()).toBe(2)
    })
  })

  it('frase que o parser não entende exige escolher o tipo antes de salvar', async () => {
    const u = userEvent.setup()
    await moto()
    montar(<Home />)

    await u.type(await screen.findByLabelText('Escreva o que aconteceu'), 'xablau 30')
    await u.click(screen.getByRole('button', { name: 'ENTENDER' }))

    expect(await screen.findByText(/Escolhe o tipo/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^SALVAR$/ })).toBeDisabled()
  })

  it('o custo do mês soma o que foi registrado', async () => {
    const m = await moto()
    await salvarServico({
      ...novoRegistro(),
      moto_id: m.id,
      item_id: null,
      descricao: 'Óleo do motor',
      data: hojeISO(),
      km: 12500,
      valor: 85,
      local: '',
      observacao: '',
      foto_url: null,
    })

    montar(<Home />)
    expect(await screen.findByText(/R\$\s*85,00/)).toBeInTheDocument()
  })
})

describe('Garagem', () => {
  it('estado vazio convida a cadastrar', async () => {
    montar(<Garagem />)
    expect(await screen.findByText(/Sua garagem está vazia/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ADICIONAR MOTO/i })).toBeInTheDocument()
  })

  it('moto sem histórico não ganha nota de saúde', async () => {
    await moto()
    montar(<Garagem />)

    expect(await screen.findByText('sem dados')).toBeInTheDocument()
    expect(screen.getByText('Dados insuficientes')).toBeInTheDocument()
  })

  it('com histórico suficiente, mostra a porcentagem', async () => {
    const m = await moto()
    const itens = await db.itens_manutencao.where('moto_id').equals(m.id).toArray()

    // Três itens feitos hoje: entram na conta como "em dia".
    for (const item of itens.slice(0, 3)) {
      await salvarServico({
        ...novoRegistro(),
        moto_id: m.id,
        item_id: item.id,
        descricao: item.nome,
        data: somarDias(hojeISO(), -1),
        km: 12470,
        valor: null,
        local: '',
        observacao: '',
        foto_url: null,
      })
    }

    montar(<Garagem />)
    expect(await screen.findByText(/%$/)).toBeInTheDocument()
    expect(screen.queryByText('Dados insuficientes')).not.toBeInTheDocument()
  })

  it('marca qual moto está ativa', async () => {
    await moto('Fanzoca')
    montar(<Garagem />)
    expect(await screen.findByText('ativa')).toBeInTheDocument()
  })
})
