import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { montar } from './ajuda'
import CadastroMoto from '@/paginas/CadastroMoto'
import { db } from '@/db/db'
import { criarMoto } from '@/db/repos'

describe('cadastro de moto', () => {
  it('busca no catálogo e mostra o modelo com a categoria', async () => {
    const u = userEvent.setup()
    montar(<CadastroMoto />, '/moto/nova')

    await u.type(await screen.findByLabelText('Buscar modelo'), '160 titan')

    expect(await screen.findByText('CG 160 Titan')).toBeInTheDocument()
    expect(screen.getByText('Street')).toBeInTheDocument()
    expect(screen.queryByText('CG 160 Fan')).not.toBeInTheDocument()
  })

  it('marca como "a conferir" o modelo que não veio da fonte oficial', async () => {
    const u = userEvent.setup()
    montar(<CadastroMoto />, '/moto/nova')

    // Biz 110i é o único modelo que não consegui confirmar na fonte oficial.
    // Se ele for confirmado um dia, este teste avisa que precisa de outro.
    await u.type(await screen.findByLabelText('Buscar modelo'), 'biz 110')

    expect(await screen.findByText(/a conferir/)).toBeInTheDocument()
  })

  it('escolher do catálogo grava os campos catalogo_* e cria o catálogo de manutenção', async () => {
    const u = userEvent.setup()
    montar(<CadastroMoto />, '/moto/nova')

    await u.type(await screen.findByLabelText('Buscar modelo'), 'titan')
    await u.click(await screen.findByText('CG 160 Titan'))

    await u.type(screen.getByPlaceholderText('12500'), '12480')
    await u.click(screen.getByRole('button', { name: /CADASTRAR/i }))

    // A moto é gravada antes dos itens. Esperar pelos 16 é o que garante
    // que a escrita terminou — esperar pela moto liberaria o teste no meio.
    await waitFor(async () => expect(await db.itens_manutencao.count()).toBe(16))

    const moto = (await db.motos.toArray())[0]
    expect(moto.catalogo_id).toBe('honda-cg-160-titan')
    expect(moto.catalogo_marca).toBe('Honda')
    expect(moto.catalogo_categoria).toBe('street')
    expect(moto.km_inicial).toBe(12480)

    const itens = await db.itens_manutencao.toArray()
    expect(itens.every((i) => i.fonte === 'padrao')).toBe(true)
  })

  it('permite cadastro manual quando o modelo não está no catálogo', async () => {
    const u = userEvent.setup()
    montar(<CadastroMoto />, '/moto/nova')

    await u.click(await screen.findByText(/Cadastrar manualmente/))
    await u.type(screen.getByPlaceholderText('Honda'), 'Traxx')
    await u.type(screen.getByPlaceholderText('CG 160'), 'Star 50')
    await u.click(screen.getByRole('button', { name: /CADASTRAR/i }))

    await waitFor(async () => expect(await db.itens_manutencao.count()).toBe(16))

    const moto = (await db.motos.toArray())[0]
    expect(moto.marca).toBe('Traxx')
    expect(moto.modelo).toBe('Star 50')
    // Sem catálogo, os campos ficam ausentes — e o app tem que aguentar.
    expect(moto.catalogo_id).toBeUndefined()
  })

  it('não deixa salvar sem nada preenchido', async () => {
    const u = userEvent.setup()
    montar(<CadastroMoto />, '/moto/nova')

    await u.click(await screen.findByText(/Cadastrar manualmente/))
    expect(screen.getByRole('button', { name: /CADASTRAR/i })).toBeDisabled()
  })

  it('perfil de uso severo encurta os intervalos dos itens', async () => {
    const u = userEvent.setup()
    montar(<CadastroMoto />, '/moto/nova')

    await u.type(await screen.findByLabelText('Buscar modelo'), 'titan')
    await u.click(await screen.findByText('CG 160 Titan'))
    await u.click(screen.getByRole('button', { name: 'Trilha' }))
    await u.click(screen.getByRole('button', { name: /CADASTRAR/i }))

    await waitFor(async () => expect(await db.itens_manutencao.count()).toBe(16))

    const oleo = (await db.itens_manutencao.toArray()).find((i) => i.nome === 'Óleo do motor')
    // 3.000 km x 0,5, arredondado para múltiplo de 5.
    expect(oleo?.intervalo_km).toBe(1500)
  })

  it('moto antiga sem catálogo continua editável', async () => {
    const antiga = await criarMoto({
      apelido: 'Velha',
      marca: 'Honda',
      modelo: 'CG 125',
      ano: 2005,
      placa: 'ABC1234',
      cor: '',
      km_inicial: 90000,
      foto_url: null,
      perfil_uso: 'urbano_leve',
    })

    montar(<CadastroMoto />, `/moto/${antiga.id}`, '/moto/:id')

    // Cai direto no passo de detalhes, sem exigir escolha no catálogo.
    expect(await screen.findByDisplayValue('Velha')).toBeInTheDocument()
    expect(screen.getByDisplayValue('90000')).toBeInTheDocument()
  })
})
