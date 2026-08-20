import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach, beforeEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { db } from '@/db/db'

/**
 * Paciência dos `findBy*` e dos `waitFor`.
 *
 * O padrão da biblioteca é 1 segundo, medido numa máquina de desenvolvimento.
 * O runner do GitHub Actions tem dois núcleos, e ali a primeira renderização
 * de uma página — carregar o módulo, abrir o Dexie, gravar a moto e os 16
 * itens, montar a árvore — passa disso com folga.
 *
 * Isso derrubou quatro deploys seguidos, do commit que introduziu estes
 * testes em diante, sempre no mesmo teste e sempre só no CI: aqui a suíte
 * passava, lá `npm test` falhava e o workflow parava antes de publicar. Como
 * ninguém olhava a aba Actions, o site simplesmente parou de ser atualizado
 * sem nenhum aviso.
 *
 * Esperar mais não afrouxa asserção nenhuma: a condição verificada é a mesma,
 * só se dá a ela o tempo que uma máquina lenta precisa. Um teste que estiver
 * de fato errado continua falhando — só demora mais para dizer isso.
 */
configure({ asyncUtilTimeout: 5_000 })

/**
 * Preparo dos testes de interface.
 *
 * `fake-indexeddb/auto` instala um IndexedDB em memória — o Dexie funciona
 * igual, sem navegador. Cada teste começa com o banco vazio, senão uma moto
 * criada num teste apareceria no seguinte.
 */
beforeEach(async () => {
  localStorage.clear()
  if (!db.isOpen()) await db.open()
  await Promise.all(db.tables.map((t) => t.clear()))
})

afterEach(() => {
  cleanup()
})
