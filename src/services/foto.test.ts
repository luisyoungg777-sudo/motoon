import { describe, expect, it } from 'vitest'
import { LARGURA_MAX, medidaDestino, pesoAproximado } from './foto'

describe('medidaDestino', () => {
  it('foto menor que o limite não é ampliada', () => {
    // Esticar não inventa detalhe, só peso.
    expect(medidaDestino(800, 600)).toEqual({ largura: 800, altura: 600 })
  })

  it('foto maior encolhe até o limite, mantendo a proporção', () => {
    const r = medidaDestino(4000, 3000)
    expect(r.largura).toBe(LARGURA_MAX)
    expect(r.altura).toBe(Math.round((3000 * LARGURA_MAX) / 4000))
    // A proporção original tem que sobreviver ao arredondamento.
    expect(r.largura / r.altura).toBeCloseTo(4000 / 3000, 2)
  })

  it('foto em pé também é limitada pela largura', () => {
    const r = medidaDestino(3000, 4000)
    expect(r.largura).toBe(LARGURA_MAX)
    expect(r.altura).toBeGreaterThan(r.largura)
  })

  it('nunca devolve altura zero, por mais deitada que a foto seja', () => {
    // Panorâmica extrema: o arredondamento poderia zerar a altura e o canvas
    // recusaria desenhar.
    expect(medidaDestino(20000, 5).altura).toBeGreaterThanOrEqual(1)
  })

  it('medida inválida não vira NaN — devolve zero e o chamador desiste', () => {
    for (const [l, a] of [
      [0, 100],
      [100, 0],
      [-10, 10],
      [Number.NaN, 100],
      [Number.POSITIVE_INFINITY, 100],
    ]) {
      expect(medidaDestino(l, a)).toEqual({ largura: 0, altura: 0 })
    }
  })

  it('respeita um limite diferente quando pedirem', () => {
    expect(medidaDestino(2000, 1000, 500)).toEqual({ largura: 500, altura: 250 })
  })
})

describe('pesoAproximado', () => {
  it('sem foto, não inventa número', () => {
    expect(pesoAproximado(null)).toBe('—')
    expect(pesoAproximado(undefined)).toBe('—')
    expect(pesoAproximado('')).toBe('—')
  })

  it('mostra a unidade que cabe', () => {
    expect(pesoAproximado('a'.repeat(400))).toMatch(/^\d+ B$/)
    expect(pesoAproximado('a'.repeat(40_000))).toMatch(/^\d+ kB$/)
    expect(pesoAproximado('a'.repeat(4_000_000))).toMatch(/^\d+(\.\d)? MB$/)
  })

  it('base64 carrega 3 bytes a cada 4 caracteres', () => {
    // 4000 caracteres = 3000 bytes ≈ 3 kB.
    expect(pesoAproximado('a'.repeat(4000))).toBe('3 kB')
  })
})
