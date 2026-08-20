import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { db } from './db/db'
import './index.css'

const raiz = ReactDOM.createRoot(document.getElementById('root')!)

/**
 * O DiasdMoto inteiro mora no IndexedDB. Se ele não abrir — janela anônima de
 * alguns navegadores, iframe sem permissão, armazenamento bloqueado — o app
 * não tem como funcionar. Melhor dizer isso com todas as letras do que
 * entregar uma tela branca sem explicação.
 */
function Bloqueado() {
  return (
    <div className="mx-auto flex min-h-screen max-w-conteudo flex-col justify-center gap-3 px-6">
      <h1 className="text-titulo font-bold">O DiasdMoto não conseguiu abrir o armazenamento</h1>
      <p className="text-corpo text-textoSec">
        Tudo que você registra fica guardado no próprio aparelho, e este navegador não está
        deixando o app gravar nada.
      </p>
      <p className="text-corpo text-textoSec">
        Costuma ser janela anônima, bloqueio de dados de site, ou o app estar aberto dentro de
        outra página. Abrir o DiasdMoto numa aba normal resolve.
      </p>
    </div>
  )
}

db.open()
  .then(() =>
    raiz.render(
      <React.StrictMode>
        <HashRouter>
          <App />
        </HashRouter>
      </React.StrictMode>,
    ),
  )
  .catch(() => raiz.render(<Bloqueado />))
