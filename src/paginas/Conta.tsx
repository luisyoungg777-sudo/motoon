import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  CloudOff,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { Aviso, Cartao, Rotulo, Skeleton } from '@/components/ui'
import { useConta } from '@/estado-conta'
import { formatarData } from '@/services/datas'
import { criarConta, definirNovaSenha, entrar, recuperarSenha, sair, type Resultado } from '@/services/auth'

type Aba = 'entrar' | 'criar' | 'esqueci'

export default function Conta() {
  const { conta, configurado, carregando } = useConta()
  const navegar = useNavigate()

  return (
    <div className="space-y-6 px-4 pb-10 pt-4">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navegar(-1)}
          aria-label="Voltar"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-textoSec hover:text-texto"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-titulo font-bold">Minha conta</h1>
      </header>

      {carregando ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      ) : !configurado ? (
        <NuvemDesligada />
      ) : conta ? (
        <Logado />
      ) : (
        <Deslogado />
      )}
    </div>
  )
}

function NuvemDesligada() {
  return (
    <div className="space-y-4">
      <Cartao className="flex items-start gap-3 p-4">
        <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-textoFraco" />
        <div className="space-y-1">
          <p className="font-semibold">Backup na nuvem ainda não está ligado</p>
          <p className="text-corpo text-textoSec">
            O Motoon funciona inteiro sem conta — tudo que você registra fica guardado neste
            aparelho. A conta serve só para copiar seus dados para a nuvem e recuperá-los se você
            trocar de celular.
          </p>
        </div>
      </Cartao>

      <Cartao className="space-y-2 p-4">
        <Rotulo>Para ligar</Rotulo>
        <ol className="list-decimal space-y-1.5 pl-4 text-corpo text-textoSec">
          <li>
            Crie um projeto gratuito em <span className="text-texto">supabase.com</span>.
          </li>
          <li>
            Rode o arquivo <span className="text-texto">supabase/schema.sql</span> deste
            repositório no editor SQL do projeto.
          </li>
          <li>
            Copie a URL e a chave <span className="text-texto">anon</span> para o arquivo{' '}
            <span className="text-texto">.env</span>.
          </li>
        </ol>
        <Aviso>
          Enquanto isso, use Ajustes → Backup para exportar um arquivo JSON. É o que protege seus
          dados hoje.
        </Aviso>
      </Cartao>
    </div>
  )
}

function Logado() {
  const { conta, pendentes, sync, ultimaSync, erroSync, sincronizarAgora } = useConta()
  const [trocando, setTrocando] = useState(false)
  const [senha, setSenha] = useState('')
  const [recado, setRecado] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  if (!conta) return null

  async function trocarSenha() {
    if (senha.length < 6) {
      setRecado('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setOcupado(true)
    const r = await definirNovaSenha(senha)
    setOcupado(false)
    setRecado(r.ok ? (r.recado ?? 'Senha trocada.') : r.erro)
    if (r.ok) {
      setSenha('')
      setTrocando(false)
    }
  }

  return (
    <div className="space-y-4">
      <Cartao className="space-y-3 p-4">
        <div>
          <Rotulo>Conectado como</Rotulo>
          <p className="mt-1 text-lg font-semibold">{conta.nome ?? 'Sem nome'}</p>
          <p className="text-corpo text-textoSec">{conta.email}</p>
        </div>
      </Cartao>

      <Cartao className="space-y-3 p-4">
        <Rotulo>Sincronização</Rotulo>

        {sync === 'sincronizando' ? (
          <p className="flex items-center gap-2 font-semibold text-textoSec">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Sincronizando…
          </p>
        ) : sync === 'erro' ? (
          <p className="flex items-start gap-2 font-semibold text-perigo">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              Não consegui sincronizar
              {erroSync && <span className="block text-corpo font-normal">{erroSync}</span>}
            </span>
          </p>
        ) : pendentes > 0 ? (
          <p className="flex items-center gap-2 font-semibold text-aviso">
            <RefreshCw className="h-5 w-5" />
            {pendentes} {pendentes === 1 ? 'alteração pendente' : 'alterações pendentes'}
          </p>
        ) : (
          <p className="flex items-center gap-2 font-semibold text-sucesso">
            <CheckCircle2 className="h-5 w-5" />
            Tudo sincronizado
          </p>
        )}

        <p className="text-corpo text-textoSec">
          {ultimaSync
            ? `Última sincronização em ${formatarData(ultimaSync.slice(0, 10))} às ${ultimaSync.slice(11, 16)}.`
            : 'Ainda não sincronizou nesta conta.'}
        </p>

        {pendentes > 0 && sync !== 'sincronizando' && (
          <p className="text-corpo text-textoSec">
            O que está pendente continua guardado aqui. Nada se perde — o Motoon tenta de novo
            sozinho quando a internet voltar.
          </p>
        )}

        <button
          type="button"
          className="btn-escuro w-full"
          disabled={sync === 'sincronizando'}
          onClick={() => void sincronizarAgora()}
        >
          <RefreshCw className="h-[18px] w-[18px]" />
          Sincronizar agora
        </button>
      </Cartao>

      {trocando ? (
        <Cartao className="space-y-3 p-4">
          <label className="block">
            <span className="rotulo">Nova senha</span>
            <input
              className="campo"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          {recado && <p className="text-corpo text-aviso">{recado}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn-escuro flex-1" onClick={() => setTrocando(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-laranja flex-1"
              disabled={ocupado}
              onClick={trocarSenha}
            >
              Salvar
            </button>
          </div>
        </Cartao>
      ) : (
        <button type="button" className="btn-escuro w-full" onClick={() => setTrocando(true)}>
          <KeyRound className="h-5 w-5" />
          Trocar senha
        </button>
      )}

      {recado && !trocando && <p className="text-corpo text-sucesso">{recado}</p>}

      <button type="button" className="btn-fantasma w-full" onClick={() => sair()}>
        <LogOut className="h-5 w-5" />
        Sair da conta
      </button>
    </div>
  )
}

function Deslogado() {
  const [aba, setAba] = useState<Aba>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const abas: { valor: Aba; rotulo: string }[] = [
    { valor: 'entrar', rotulo: 'Entrar' },
    { valor: 'criar', rotulo: 'Criar conta' },
  ]

  async function enviar() {
    if (!email.trim()) {
      setResultado({ ok: false, erro: 'Falta o e-mail.' })
      return
    }
    if (aba !== 'esqueci' && senha.length < 6) {
      setResultado({ ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' })
      return
    }

    setOcupado(true)
    const r =
      aba === 'entrar'
        ? await entrar(email, senha)
        : aba === 'criar'
          ? await criarConta(email, senha, nome)
          : await recuperarSenha(email)
    setOcupado(false)
    setResultado(r)
    if (r.ok) setSenha('')
  }

  return (
    <div className="space-y-4">
      <Cartao className="flex items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primaria" />
        <div className="space-y-1">
          <p className="font-semibold">Quer proteger seus dados?</p>
          <p className="text-corpo text-textoSec">
            Crie uma conta gratuita para sincronizar sua garagem. O Motoon continua funcionando sem
            conta — nada seu sai do aparelho enquanto você não entrar.
          </p>
        </div>
      </Cartao>

      {aba !== 'esqueci' && (
        <div className="flex gap-1 rounded-lg border border-borda bg-superficie2 p-1">
          {abas.map((a) => (
            <button
              key={a.valor}
              type="button"
              onClick={() => {
                setAba(a.valor)
                setResultado(null)
              }}
              className={`min-h-[42px] flex-1 rounded-lg text-sm font-semibold transition-colors ${
                aba === a.valor ? 'bg-primaria text-black' : 'text-textoSec hover:text-texto'
              }`}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {aba === 'criar' && (
          <label className="block">
            <span className="rotulo">Nome</span>
            <input
              className="campo"
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Como quer ser chamado"
            />
          </label>
        )}

        <label className="block">
          <span className="rotulo">E-mail</span>
          <input
            className="campo"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </label>

        {aba !== 'esqueci' && (
          <label className="block">
            <span className="rotulo">Senha</span>
            <input
              className="campo"
              type="password"
              autoComplete={aba === 'criar' ? 'new-password' : 'current-password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enviar()}
            />
          </label>
        )}
      </div>

      {resultado && !resultado.ok && (
        <p className="flex items-start gap-2 text-corpo text-perigo">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {resultado.erro}
        </p>
      )}

      {resultado?.ok && resultado.recado && (
        <p className="flex items-start gap-2 text-corpo text-sucesso">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {resultado.recado}
        </p>
      )}

      <button type="button" className="btn-laranja w-full" disabled={ocupado} onClick={enviar}>
        {ocupado
          ? 'Aguarde…'
          : aba === 'entrar'
            ? 'ENTRAR'
            : aba === 'criar'
              ? 'CRIAR CONTA'
              : 'ENVIAR LINK'}
      </button>

      <button
        type="button"
        className="btn-fantasma w-full text-sm"
        onClick={() => {
          setAba(aba === 'esqueci' ? 'entrar' : 'esqueci')
          setResultado(null)
        }}
      >
        {aba === 'esqueci' ? 'Voltar para o login' : 'Esqueci minha senha'}
      </button>
    </div>
  )
}
