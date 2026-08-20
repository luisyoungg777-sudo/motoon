import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { db } from '@/db/db'

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
