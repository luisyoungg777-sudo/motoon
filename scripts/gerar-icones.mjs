/**
 * Gera a marca do DiasdMoto e os ícones do app.
 *
 *   node scripts/gerar-icones.mjs
 *
 * Escreve em public/: os SVG da marca e os PNG que o manifesto e o iOS pedem.
 *
 * Por que um rasterizador próprio em vez de `sharp` ou `resvg`: a marca é meia
 * dúzia de círculos e retângulos arredondados. Testar se um ponto está dentro
 * de cada um é aritmética de colégio, e vale menos que arrastar uma
 * dependência binária de 30 MB — que ainda precisaria compilar em cada
 * máquina e no CI só para redesenhar quatro arquivos que quase nunca mudam.
 *
 * A marca é a letra `d` do meio do nome: a barriga do `d` é a roda. O `d` é
 * monolinear — o anel e a haste têm a mesma espessura, e a haste nasce na
 * borda do contorno interno, que é como um `d` de verdade se monta.
 */

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLICO = join(RAIZ, 'public')

const LARANJA = [0xff, 0x6b, 0x00]
const PRETO = [0x0b, 0x0e, 0x13]

// ---------------------------------------------------------------- geometria
// Tudo no quadro de 512, o mesmo do SVG.
const CX = 200 + 56 // o `translate(56 -4)` que centraliza a marca já aplicado
const CY = 312 - 4
const RO = 122 // borda externa do anel (o pneu)
const RI = 82 // vazio da letra
const RAIO_CUBO = 20

const HASTE = { x0: 256 + RI, y0: 80, x1: 256 + RO, y1: 432, r: 20 }
const RAIO_ESPIGA = 7
const ESPIGA = { meia: 7, de: 18, ate: RI + 2 } // do cubo até encostar no aro

/** Distância de um ponto ao retângulo arredondado, negativa dentro. */
function distRetangulo(px, py, x0, y0, x1, y1, r) {
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const hx = (x1 - x0) / 2 - r
  const hy = (y1 - y0) / 2 - r
  const dx = Math.abs(px - cx) - hx
  const dy = Math.abs(py - cy) - hy
  const fora = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  return fora + Math.min(Math.max(dx, dy), 0) - r
}

/** A letra cobre este ponto? */
function naLetra(px, py) {
  const dx = px - CX
  const dy = py - CY
  const d = Math.hypot(dx, dy)

  if (d >= RI && d <= RO) return true // o anel
  if (d <= RAIO_CUBO) return true // o cubo
  if (distRetangulo(px, py, HASTE.x0, HASTE.y0, HASTE.x1, HASTE.y1, HASTE.r) <= 0) return true

  // Os cinco raios: gira o ponto para o eixo de cada um e testa uma vez só.
  for (let i = 0; i < 5; i++) {
    const a = ((-90 + i * 72) * Math.PI) / 180
    const cos = Math.cos(-a)
    const sen = Math.sin(-a)
    const rx = dx * cos - dy * sen
    const ry = dx * sen + dy * cos
    // No eixo do raio, ele é um retângulo vertical acima do centro.
    if (
      distRetangulo(
        rx,
        ry,
        -ESPIGA.meia,
        -ESPIGA.ate,
        ESPIGA.meia,
        -ESPIGA.de,
        RAIO_ESPIGA,
      ) <= 0
    ) {
      return true
    }
  }
  return false
}

/**
 * Desenha num buffer RGBA. `escala` encolhe a marca em torno do centro — é o
 * que a versão maskable precisa, porque o sistema recorta o ícone num círculo
 * e só o miolo de 80% é zona segura.
 */
function desenhar(lado, { fundo, tinta, escala = 1, amostras = 4 }) {
  const px = Buffer.alloc(lado * lado * 4)
  const passo = 512 / lado
  const sub = passo / amostras

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      let dentro = 0
      for (let sy = 0; sy < amostras; sy++) {
        for (let sx = 0; sx < amostras; sx++) {
          // centro de cada sub-amostra, no espaço de 512
          let ux = (x * passo) + (sx + 0.5) * sub
          let uy = (y * passo) + (sy + 0.5) * sub
          if (escala !== 1) {
            ux = 256 + (ux - 256) / escala
            uy = 256 + (uy - 256) / escala
          }
          if (naLetra(ux, uy)) dentro++
        }
      }
      const cobertura = dentro / (amostras * amostras)
      const i = (y * lado + x) * 4

      if (fundo) {
        for (let c = 0; c < 3; c++) {
          px[i + c] = Math.round(fundo[c] + (tinta[c] - fundo[c]) * cobertura)
        }
        px[i + 3] = 255
      } else {
        // Sem fundo: a tinta entra com a cobertura como alfa.
        for (let c = 0; c < 3; c++) px[i + c] = tinta[c]
        px[i + 3] = Math.round(cobertura * 255)
      }
    }
  }
  return px
}

// -------------------------------------------------------------------- PNG
const TABELA_CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pedaco(tipo, dados) {
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const tam = Buffer.alloc(4)
  tam.writeUInt32BE(dados.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tam, corpo, crc])
}

function png(px, lado) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(lado, 0)
  ihdr.writeUInt32BE(lado, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 6 // RGBA
  // 10,11,12 = deflate, filtro padrão, sem entrelaçamento — todos zero.

  // Cada linha leva um byte de filtro na frente; zero é "sem filtro".
  const linhas = Buffer.alloc(lado * (lado * 4 + 1))
  for (let y = 0; y < lado; y++) {
    linhas[y * (lado * 4 + 1)] = 0
    px.copy(linhas, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(linhas, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ])
}

// -------------------------------------------------------------------- SVG
function letraSVG(cor) {
  const partes = [
    `<circle cx="${CX}" cy="${CY}" r="${(RO + RI) / 2}" fill="none" stroke="${cor}" stroke-width="${RO - RI}"/>`,
    `<rect x="${HASTE.x0}" y="${HASTE.y0}" width="${HASTE.x1 - HASTE.x0}" height="${HASTE.y1 - HASTE.y0}" rx="${HASTE.r}" fill="${cor}"/>`,
    `<circle cx="${CX}" cy="${CY}" r="${RAIO_CUBO}" fill="${cor}"/>`,
  ]
  for (let i = 0; i < 5; i++) {
    partes.push(
      `<rect x="${-ESPIGA.meia}" y="${-ESPIGA.ate}" width="${ESPIGA.meia * 2}" height="${ESPIGA.ate - ESPIGA.de}" rx="${RAIO_ESPIGA}" fill="${cor}" transform="translate(${CX} ${CY}) rotate(${-90 + i * 72})"/>`,
    )
  }
  return partes.join('')
}

const hex = (c) => '#' + c.map((n) => n.toString(16).padStart(2, '0')).join('')

function svg(corpo) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" ` +
    `role="img" aria-label="DiasdMoto"><title>DiasdMoto</title>${corpo}</svg>`
  )
}

// ------------------------------------------------------------------ saída
mkdirSync(PUBLICO, { recursive: true })

const ladrilho = `<rect width="512" height="512" fill="${hex(LARANJA)}"/>${letraSVG(hex(PRETO))}`

writeFileSync(join(PUBLICO, 'icone.svg'), svg(ladrilho))
writeFileSync(join(PUBLICO, 'marca.svg'), svg(letraSVG(hex(LARANJA))))

const ICONE = { fundo: LARANJA, tinta: PRETO }

const arquivos = [
  ['icone-192.png', 192, ICONE],
  ['icone-512.png', 512, ICONE],
  // Maskable: o sistema recorta em círculo. A marca encolhe para caber na
  // zona segura e o laranja continua sangrando até a borda.
  ['icone-maskable-512.png', 512, { ...ICONE, escala: 0.84 }],
  ['apple-touch-icon.png', 180, ICONE],
]

for (const [nome, lado, opcoes] of arquivos) {
  const dados = png(desenhar(lado, opcoes), lado)
  writeFileSync(join(PUBLICO, nome), dados)
  console.log(`${nome.padEnd(26)} ${lado}×${lado}  ${(dados.length / 1024).toFixed(1)} kB`)
}

console.log('icone.svg, marca.svg')
