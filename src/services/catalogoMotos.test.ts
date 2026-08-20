import { describe, expect, it } from 'vitest'
import {
  buscarModelos,
  contarParaRevisar,
  listarCategorias,
  listarMarcas,
  obterModelo,
  rotuloPlaceholder,
} from './catalogoMotos'
import { MOTOS_BR } from '@/data/motos-br'

const nomes = (termo: string) => buscarModelos(termo).map((m) => m.modelo)

describe('catálogo — integridade dos dados', () => {
  it('tem as três marcas iniciais', () => {
    expect(listarMarcas()).toEqual(['Honda', 'Shineray', 'Yamaha'])
  })

  it('não tem id repetido', () => {
    const ids = MOTOS_BR.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todo modelo declara procedência e fonte', () => {
    for (const m of MOTOS_BR) {
      expect(m.procedencia, m.id).toBeDefined()
      expect(m.fonteUrl, m.id).toMatch(/^https:\/\//)
    }
  })

  it('nenhum modelo carrega imagem externa — decisão de projeto', () => {
    expect(MOTOS_BR.every((m) => m.imagemUrl === undefined)).toBe(true)
  })

  it('o que não veio da fonte oficial está marcado para revisão', () => {
    for (const m of MOTOS_BR) {
      if (m.procedencia === 'linha-conhecida') expect(m.revisar, m.id).toBe(true)
    }
    expect(contarParaRevisar()).toBeGreaterThan(0)
  })
})

describe('catálogo — busca', () => {
  it('acha por marca', () => {
    const r = buscarModelos('shineray')
    expect(r.length).toBeGreaterThan(10)
    expect(r.every((m) => m.marca === 'Shineray')).toBe(true)
  })

  it('acha por modelo inteiro', () => {
    expect(nomes('CG 160 Titan')[0]).toBe('CG 160 Titan')
  })

  it('acha por pedaço do modelo', () => {
    expect(nomes('cg')).toContain('CG 160 Fan')
    expect(nomes('cg')).toContain('CG 160 Titan')
  })

  it('acha por palavra do meio do nome', () => {
    expect(nomes('titan')).toEqual(['CG 160 Titan'])
  })

  it('acha combinando marca e modelo', () => {
    expect(nomes('honda titan')).toEqual(['CG 160 Titan'])
  })

  it('acha combinando cilindrada e nome', () => {
    expect(nomes('160 titan')).toEqual(['CG 160 Titan'])
  })

  it('exige todos os termos — não devolve quem casa só um', () => {
    // 'yamaha' casa a marca, 'titan' não existe na Yamaha.
    expect(nomes('yamaha titan')).toEqual([])
  })

  it('ignora acento e caixa', () => {
    expect(nomes('TÉNÉRÉ')).toContain('Ténéré 700')
    expect(nomes('tenere')).toContain('Ténéré 700')
  })

  it('modelo inexistente devolve vazio', () => {
    expect(buscarModelos('lambreta voadora')).toEqual([])
    expect(buscarModelos('zzzzz')).toEqual([])
  })

  it('busca vazia devolve o catálogo ordenado por marca e modelo', () => {
    const r = buscarModelos({ texto: '', limite: 3 })
    expect(r).toHaveLength(3)
    expect(r.every((m) => m.marca === 'Honda')).toBe(true)
  })

  it('respeita o limite', () => {
    expect(buscarModelos({ texto: 'a', limite: 4 }).length).toBeLessThanOrEqual(4)
  })
})

describe('catálogo — filtros', () => {
  it('filtra por marca', () => {
    const r = buscarModelos({ marca: 'Yamaha' })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((m) => m.marca === 'Yamaha')).toBe(true)
  })

  it('filtra por categoria', () => {
    const r = buscarModelos({ categoria: 'scooter', limite: 100 })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((m) => m.categoria === 'scooter')).toBe(true)
  })

  it('combina marca, categoria e texto', () => {
    const r = buscarModelos({ marca: 'Honda', categoria: 'trail', texto: 'xre' })
    expect(r.map((m) => m.modelo)).toContain('XRE 190')
    expect(r.every((m) => m.marca === 'Honda' && m.categoria === 'trail')).toBe(true)
  })

  it('lista só as categorias realmente usadas', () => {
    const cats = listarCategorias()
    expect(cats).toContain('street')
    expect(cats).toContain('scooter')
    expect(cats.length).toBeGreaterThan(3)
  })
})

describe('catálogo — nome curto', () => {
  it('o nome comercial completo continua sendo o do modelo', () => {
    expect(obterModelo('yamaha-fazer-fz15-abs-connected')?.modelo).toBe(
      'Fazer FZ15 ABS Connected',
    )
  })

  it('quem tem nome comprido ganha versão curta', () => {
    expect(obterModelo('yamaha-fazer-fz15-abs-connected')?.nomeCurto).toBe('Fazer FZ15')
    expect(obterModelo('yamaha-nmax-abs-connected')?.nomeCurto).toBe('NMAX')
  })

  it('nome já curto não recebe apelido', () => {
    expect(obterModelo('honda-cg-160-titan')?.nomeCurto).toBeUndefined()
    expect(obterModelo('yamaha-factor')?.nomeCurto).toBeUndefined()
  })

  it('a busca continua achando pelo nome completo', () => {
    expect(nomes('connected').length).toBeGreaterThan(0)
    expect(nomes('fz15 abs')).toContain('Fazer FZ15 ABS Connected')
  })

  it('e também pelo nome curto', () => {
    expect(nomes('nmax')).toContain('NMAX ABS Connected')
    expect(nomes('fazer fz15')).toContain('Fazer FZ15 ABS Connected')
  })

  it('nome curto nunca é maior que o completo', () => {
    for (const m of MOTOS_BR) {
      if (m.nomeCurto) expect(m.nomeCurto.length, m.id).toBeLessThan(m.modelo.length)
    }
  })
})

describe('catálogo — apoio à interface', () => {
  it('obterModelo devolve pelo id e null quando não existe', () => {
    expect(obterModelo('honda-cg-160-titan')?.modelo).toBe('CG 160 Titan')
    expect(obterModelo('nao-existe')).toBeNull()
  })

  it('placeholder tem sempre marca e modelo para desenhar', () => {
    expect(rotuloPlaceholder({ marca: 'Honda', modelo: 'CG 160 Titan' })).toEqual({
      marca: 'HONDA',
      modelo: 'CG 160 TITAN',
    })
  })

  it('funciona como fallback para moto sem catálogo', () => {
    expect(rotuloPlaceholder({ marca: '', modelo: 'Moto antiga' }).modelo).toBe('MOTO ANTIGA')
  })
})
