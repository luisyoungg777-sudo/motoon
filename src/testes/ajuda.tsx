import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProvedorMoto } from '@/estado'
import { ProvedorConta } from '@/estado-conta'

/**
 * Monta um pedaço do app com os provedores de verdade e o Dexie de verdade
 * (em memória, via fake-indexeddb). Nada de mock: o que quebra aqui quebra
 * no aparelho.
 *
 * `padrao` é o caminho da rota, necessário quando a tela lê useParams —
 * sem ele o :id chega vazio e o teste testa outra coisa.
 */
export function montar(elemento: ReactElement, rota = '/', padrao = '*') {
  return render(
    <ProvedorConta>
      <ProvedorMoto>
        <MemoryRouter initialEntries={[rota]}>
          <Routes>
            <Route path={padrao} element={elemento} />
          </Routes>
        </MemoryRouter>
      </ProvedorMoto>
    </ProvedorConta>,
  )
}
