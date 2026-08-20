import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Bike, CircleUser, LayoutGrid, List, Settings, Wallet } from 'lucide-react'
import { ProvedorMoto, useMoto } from './estado'
import { ProvedorConta } from './estado-conta'
import Home from './paginas/Home'
import Garagem from './paginas/Garagem'
import CadastroMoto from './paginas/CadastroMoto'
import DetalheMoto from './paginas/DetalheMoto'
import Historico from './paginas/Historico'
import Custos from './paginas/Custos'
import Config from './paginas/Config'
import Conta from './paginas/Conta'
import ItensMoto from './paginas/ItensMoto'
import { Skeleton } from './components/ui'
import { Marca, NomeEscrito } from './components/icones'

const ABAS = [
  { para: '/', rotulo: 'Moto', Icone: Bike },
  { para: '/garagem', rotulo: 'Garagem', Icone: LayoutGrid },
  { para: '/historico', rotulo: 'Histórico', Icone: List },
  { para: '/custos', rotulo: 'Custos', Icone: Wallet },
]

const EXTRAS = [
  { para: '/config', rotulo: 'Ajustes', Icone: Settings },
  { para: '/conta', rotulo: 'Minha conta', Icone: CircleUser },
]

/** Celular: barra inferior. Escondida no desktop, que ganha a lateral. */
function BarraInferior() {
  return (
    <nav
      aria-label="Navegação principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie/95 backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex max-w-conteudo">
        {ABAS.map(({ para, rotulo, Icone }) => (
          <NavLink
            key={para}
            to={para}
            end={para === '/'}
            className={({ isActive }) =>
              `flex min-h-toque flex-1 flex-col items-center justify-center gap-1 pt-2 text-[11px] font-semibold transition-colors ${
                isActive ? 'text-primaria' : 'text-textoFraco hover:text-textoSec'
              }`
            }
          >
            <Icone className="h-[18px] w-[18px]" />
            {rotulo}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** Desktop: lateral fixa. Não é a versão mobile esticada. */
function Lateral() {
  const item = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-superficie2 text-texto shadow-[inset_2px_0_0_rgb(var(--primary))]'
        : 'text-textoFraco hover:text-textoSec'
    }`

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-6 border-r border-borda bg-superficie px-4 py-6 lg:flex">
      <p className="flex items-center gap-2.5 px-2 text-lg font-extrabold tracking-tight">
        <Marca className="h-7 w-[19px] text-primaria" />
        <NomeEscrito destacado={false} />
      </p>

      <nav aria-label="Seções do DiasdMoto" className="flex flex-col gap-1">
        {ABAS.map(({ para, rotulo, Icone }) => (
          <NavLink key={para} to={para} end={para === '/'} className={item}>
            <Icone className="h-[18px] w-[18px]" />
            {rotulo}
          </NavLink>
        ))}
      </nav>

      <nav aria-label="Conta e ajustes" className="mt-auto flex flex-col gap-1">
        {EXTRAS.map(({ para, rotulo, Icone }) => (
          <NavLink key={para} to={para} className={item}>
            <Icone className="h-[18px] w-[18px]" />
            {rotulo}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

function Esqueleto() {
  const { carregando, motos } = useMoto()
  const local = useLocation()

  if (carregando) {
    return (
      <div className="mx-auto max-w-conteudo space-y-4 px-4 pt-6">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  const semMoto = motos.length === 0
  // Só o formulário de moto ocupa a tela inteira. Painel e itens são telas
  // normais e mantêm a navegação.
  const emCadastro =
    local.pathname === '/moto/nova' || /^\/moto\/[^/]+$/.test(local.pathname)
  // Quem ainda não cadastrou moto precisa conseguir chegar na conta — é por
  // lá que se recupera uma garagem sincronizada em outro aparelho.
  const dispensaMoto = emCadastro || local.pathname === '/conta'

  if (semMoto && !dispensaMoto) return <Navigate to="/moto/nova" replace />

  const rotas = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/garagem" element={<Garagem />} />
      <Route path="/historico" element={<Historico />} />
      <Route path="/custos" element={<Custos />} />
      <Route path="/config" element={<Config />} />
      <Route path="/conta" element={<Conta />} />
      <Route path="/moto/nova" element={<CadastroMoto />} />
      <Route path="/moto/:id" element={<CadastroMoto />} />
      <Route path="/moto/:id/painel" element={<DetalheMoto />} />
      <Route path="/moto/:id/itens" element={<ItensMoto />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )

  // O cadastro ocupa a tela inteira, sem navegação competindo com ele.
  if (emCadastro) {
    return <div className="mx-auto min-h-screen max-w-conteudo">{rotas}</div>
  }

  return (
    <div className="flex min-h-screen">
      <Lateral />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-conteudo pb-24 lg:max-w-2xl lg:pb-10">{rotas}</main>
      </div>
      <BarraInferior />
    </div>
  )
}

export default function App() {
  return (
    <ProvedorConta>
      <ProvedorMoto>
        <Esqueleto />
      </ProvedorMoto>
    </ProvedorConta>
  )
}
