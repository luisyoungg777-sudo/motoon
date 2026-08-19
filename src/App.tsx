import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProvedorMoto, useMoto } from './estado'
import Home from './paginas/Home'
import CadastroMoto from './paginas/CadastroMoto'
import Historico from './paginas/Historico'
import Custos from './paginas/Custos'
import Config from './paginas/Config'
import ItensMoto from './paginas/ItensMoto'
import { IcoDinheiro, IcoEngrenagem, IcoLista, IcoMoto } from './components/icones'

const ABAS = [
  { para: '/', rotulo: 'Moto', Icone: IcoMoto },
  { para: '/historico', rotulo: 'Histórico', Icone: IcoLista },
  { para: '/custos', rotulo: 'Custos', Icone: IcoDinheiro },
  { para: '/config', rotulo: 'Ajustes', Icone: IcoEngrenagem },
]

function BarraInferior() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-painel/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {ABAS.map(({ para, rotulo, Icone }) => (
          <NavLink
            key={para}
            to={para}
            end={para === '/'}
            className={({ isActive }) =>
              `flex min-h-toque flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[11px] font-bold ${
                isActive ? 'text-laranja' : 'text-apagado'
              }`
            }
          >
            <Icone className="h-5 w-5" />
            {rotulo}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Esqueleto() {
  const { carregando, motos } = useMoto()
  const local = useLocation()

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-apagado">Carregando…</div>
    )
  }

  const semMoto = motos.length === 0
  const naTelaDeCadastro = local.pathname.startsWith('/moto/')

  if (semMoto && !naTelaDeCadastro) {
    return <Navigate to="/moto/nova" replace />
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-24">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/custos" element={<Custos />} />
        <Route path="/config" element={<Config />} />
        <Route path="/moto/nova" element={<CadastroMoto />} />
        <Route path="/moto/:id" element={<CadastroMoto />} />
        <Route path="/moto/:id/itens" element={<ItensMoto />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!naTelaDeCadastro && <BarraInferior />}
    </div>
  )
}

export default function App() {
  return (
    <ProvedorMoto>
      <Esqueleto />
    </ProvedorMoto>
  )
}
