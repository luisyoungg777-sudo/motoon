/**
 * Preparo de foto para guardar no aparelho.
 *
 * A foto vira data URL e mora no IndexedDB junto do registro — não há bucket,
 * não há upload separado, e ela existe offline como todo o resto. O preço
 * disso é que ela também viaja na sincronização, dentro da linha, a cada vez
 * que o registro sobe.
 *
 * Por isso ela é reduzida ANTES de virar texto. Uma foto de celular tem de 3
 * a 8 MB, e base64 ainda infla um terço: guardar o original significaria
 * megabytes por moto no banco local e os mesmos megabytes subindo a cada
 * upsert, num Supabase gratuito de 500 MB. Reduzida, ela fica na casa das
 * centenas de kB — de trinta a cinquenta vezes menor.
 *
 * E não se perde nada visível: o maior lugar onde a foto aparece tem 160 px
 * de altura na tela e algumas dezenas de milímetros no PDF. 1280 px de
 * largura ainda sobra para tela de alta densidade.
 */

export const LARGURA_MAX = 1280
export const QUALIDADE = 0.72

/**
 * O tamanho de destino, mantendo a proporção. Foto menor que o limite não é
 * ampliada — esticar não inventa detalhe, só peso.
 *
 * Separada e pura porque é a única parte com aritmética, e é a que dá para
 * testar sem navegador.
 */
export function medidaDestino(
  largura: number,
  altura: number,
  larguraMax = LARGURA_MAX,
): { largura: number; altura: number } {
  if (!Number.isFinite(largura) || !Number.isFinite(altura) || largura <= 0 || altura <= 0) {
    return { largura: 0, altura: 0 }
  }

  if (largura <= larguraMax) return { largura: Math.round(largura), altura: Math.round(altura) }

  const fator = larguraMax / largura
  return { largura: larguraMax, altura: Math.max(1, Math.round(altura * fator)) }
}

/** Lê o arquivo cru como data URL. É o caminho de escape, não o normal. */
function lerCru(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result))
    leitor.onerror = () => reject(new Error('não deu para ler a foto'))
    leitor.readAsDataURL(arquivo)
  })
}

/**
 * Reduz e comprime. Se qualquer etapa falhar — navegador antigo, canvas
 * bloqueado, formato exótico —, devolve a foto crua em vez de devolver nada:
 * guardar pesado é ruim, perder a foto da pessoa é pior.
 */
export async function prepararFoto(arquivo: File): Promise<string> {
  const cru = await lerCru(arquivo)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('imagem ilegível'))
      i.src = cru
    })

    const { largura, altura } = medidaDestino(img.naturalWidth, img.naturalHeight)
    if (largura === 0) return cru

    const tela = document.createElement('canvas')
    tela.width = largura
    tela.height = altura

    const ctx = tela.getContext('2d')
    if (!ctx) return cru

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, largura, altura)

    const reduzida = tela.toDataURL('image/jpeg', QUALIDADE)

    // PNG de print de tela às vezes sai MAIOR depois de virar JPEG. Fica com
    // o menor dos dois — a conta é trivial e evita piorar sem querer.
    return reduzida.length < cru.length ? reduzida : cru
  } catch {
    return cru
  }
}

/** Quanto a foto ocupa depois de virar texto, para mostrar a quem quiser saber. */
export function pesoAproximado(dataUrl: string | null | undefined): string {
  if (!dataUrl) return '—'
  // base64 carrega 3 bytes a cada 4 caracteres.
  const bytes = Math.round((dataUrl.length * 3) / 4)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
