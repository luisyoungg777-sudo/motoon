import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Search } from 'lucide-react'
import { Alternador, Aviso, Rotulo } from '@/components/ui'
import { SilhuetaMoto } from '@/components/MotoPalco'
import { IcoCamera } from '@/components/icones'
import { pesoAproximado, prepararFoto } from '@/services/foto'
import { buscarModelos, listarMarcas } from '@/services/catalogoMotos'
import { criarMoto, obterMoto, recalcularItensPadrao, salvarMoto } from '@/db/repos'
import { useMoto } from '@/estado'
import { formatarPlaca } from '@/services/formato'
import {
  FATOR_PERFIL,
  ROTULO_CATEGORIA_MOTO,
  type ModeloMoto,
  type Moto,
  type PerfilUso,
} from '@/types'

const PERFIS: { valor: PerfilUso; rotulo: string }[] = [
  { valor: 'urbano_leve', rotulo: 'Urbano leve' },
  { valor: 'urbano_pesado', rotulo: 'Urbano pesado' },
  { valor: 'trilha', rotulo: 'Trilha' },
]

const EXPLICACAO_PERFIL: Record<PerfilUso, string> = {
  urbano_leve: 'Uso normal. Os intervalos ficam como a referência genérica.',
  urbano_pesado: 'Dia todo na rua, para-e-anda, entrega. Intervalos encurtam 30%.',
  trilha: 'Terra, barro, poeira. Intervalos entram pela metade.',
}

export default function CadastroMoto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { trocarMoto } = useMoto()
  const editando = Boolean(id)

  const [original, setOriginal] = useState<Moto | null>(null)
  const [escolhido, setEscolhido] = useState<ModeloMoto | null>(null)
  const [manual, setManual] = useState(false)

  const [busca, setBusca] = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState<string | null>(null)

  const [apelido, setApelido] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [placa, setPlaca] = useState('')
  const [cor, setCor] = useState('')
  const [kmInicial, setKmInicial] = useState('')
  const [perfil, setPerfil] = useState<PerfilUso>('urbano_leve')
  const [salvando, setSalvando] = useState(false)
  const [foto, setFoto] = useState<string | null>(null)
  const [preparandoFoto, setPreparandoFoto] = useState(false)
  const entradaFoto = useRef<HTMLInputElement>(null)

  async function escolherFoto(arquivo?: File) {
    if (!arquivo) return
    setPreparandoFoto(true)
    // Reduz antes de guardar: a foto vira texto dentro do registro e sobe
    // junto na sincronização. Ver src/services/foto.ts.
    setFoto(await prepararFoto(arquivo))
    setPreparandoFoto(false)
  }

  useEffect(() => {
    if (!id) return
    obterMoto(id).then((m) => {
      if (!m) return
      setOriginal(m)
      setApelido(m.apelido)
      setMarca(m.marca)
      setModelo(m.modelo)
      setAno(m.ano ? String(m.ano) : '')
      setPlaca(m.placa)
      setCor(m.cor)
      setKmInicial(String(m.km_inicial))
      setPerfil(m.perfil_uso)
      setFoto(m.foto_url)
      setManual(true)
    })
  }, [id])

  const resultados = useMemo(
    () => buscarModelos({ texto: busca, marca: marcaFiltro, limite: 12 }),
    [busca, marcaFiltro],
  )

  function escolher(m: ModeloMoto) {
    setEscolhido(m)
    setMarca(m.marca)
    setModelo(m.modelo)
    if (!apelido) setApelido(m.nomeCurto ?? m.modelo)
  }

  const identificada = escolhido !== null || manual
  const podeSalvar = modelo.trim().length > 0 || apelido.trim().length > 0

  async function salvar() {
    if (!podeSalvar || salvando) return
    setSalvando(true)

    const doCatalogo = escolhido
      ? {
          catalogo_id: escolhido.id,
          catalogo_marca: escolhido.marca,
          catalogo_modelo: escolhido.modelo,
          catalogo_categoria: escolhido.categoria,
          catalogo_fonte_url: escolhido.fonteUrl,
        }
      : {}

    const dados = {
      apelido: apelido.trim() || modelo.trim(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: ano ? Number(ano) : null,
      placa: formatarPlaca(placa),
      cor: cor.trim(),
      km_inicial: Number(kmInicial) || 0,
      foto_url: foto,
      perfil_uso: perfil,
      ...doCatalogo,
    }

    if (original) {
      const perfilMudou = original.perfil_uso !== perfil
      await salvarMoto({ ...original, ...dados })
      if (perfilMudou) await recalcularItensPadrao(original.id, perfil)
      navegar('/garagem')
    } else {
      const nova = await criarMoto(dados)
      trocarMoto(nova.id)
      navegar('/')
    }
    setSalvando(false)
  }

  // ------------------------------------------------- passo 1: qual é a moto
  if (!identificada) {
    return (
      <div className="animate-entrar min-h-screen px-4 pb-8 pt-4">
        <button
          type="button"
          onClick={() => navegar(-1)}
          className="-ml-2 mb-5 flex items-center gap-2 rounded-lg py-2 pl-2 pr-3 text-sm font-medium text-textoSec hover:text-texto"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
          Adicionar moto
        </button>

        <h1 className="text-display font-extrabold">Qual é a sua moto?</h1>
        <p className="mt-1.5 text-corpo text-textoSec">
          Digite a marca ou o modelo. O resto é opcional.
        </p>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-textoFraco" />
          <input
            className="campo pl-11"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="cg 160, titan, nmax…"
            autoComplete="off"
            aria-label="Buscar modelo"
            autoFocus
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[null, ...listarMarcas()].map((m) => (
            <button
              key={m ?? 'todas'}
              type="button"
              onClick={() => setMarcaFiltro(m)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                marcaFiltro === m
                  ? 'border-primaria bg-primaria text-black'
                  : 'border-borda bg-superficie2 text-textoSec hover:text-texto'
              }`}
            >
              {m ?? 'Todas'}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2">
          {resultados.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => escolher(m)}
                className="flex w-full items-center gap-3 rounded-xl border border-borda bg-superficie p-2.5 text-left transition-colors hover:bg-superficie2"
              >
                <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-superficie2 text-superficie3">
                  <SilhuetaMoto categoria={m.categoria} className="h-8 w-auto" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-micro font-semibold uppercase tracking-[0.2em] text-primaria">
                    {m.marca}
                  </span>
                  <span className="block truncate font-semibold">{m.nomeCurto ?? m.modelo}</span>
                  <span className="block truncate text-micro text-textoFraco">
                    {ROTULO_CATEGORIA_MOTO[m.categoria]}
                    {/* Quando o nome comercial é maior, mostra ele aqui —
                        é como a moto está escrita no documento. */}
                    {m.nomeCurto && ` · ${m.modelo}`}
                    {m.revisar && ' · a conferir'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {resultados.length === 0 && busca.trim().length > 0 && (
          <p className="mt-6 text-center text-corpo text-textoSec">
            Nenhum modelo com “{busca}” no catálogo.
          </p>
        )}

        <button
          type="button"
          onClick={() => setManual(true)}
          className="mt-6 w-full py-3 text-center text-corpo text-textoSec hover:text-texto"
        >
          Não achou? <span className="font-semibold text-primaria">Cadastrar manualmente</span>
        </button>
      </div>
    )
  }

  // ------------------------------------------------ passo 2: os detalhes
  const fator = FATOR_PERFIL[perfil]

  return (
    <div className="animate-entrar min-h-screen px-4 pb-32 pt-4">
      <button
        type="button"
        onClick={() => (editando ? navegar(-1) : (setEscolhido(null), setManual(false)))}
        className="-ml-2 mb-5 flex items-center gap-2 rounded-lg py-2 pl-2 pr-3 text-sm font-medium text-textoSec hover:text-texto"
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
        {editando ? 'Voltar' : 'Trocar de moto'}
      </button>

      {escolhido && (
        <div className="palco mb-5 flex items-center gap-4 rounded-xl border border-borda p-4">
          <SilhuetaMoto
            categoria={escolhido.categoria}
            className="h-14 w-auto shrink-0 text-superficie3"
          />
          <div className="min-w-0">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-primaria">
              {escolhido.marca}
            </p>
            <p className="truncate text-lg font-extrabold tracking-tight">
              {escolhido.nomeCurto ?? escolhido.modelo}
            </p>
            <p className="truncate text-micro text-textoFraco">
              {ROTULO_CATEGORIA_MOTO[escolhido.categoria]}
              {escolhido.nomeCurto && ` · ${escolhido.modelo}`}
            </p>
          </div>
          <Check className="ml-auto h-5 w-5 shrink-0 text-primaria" />
        </div>
      )}

      {/*
        A foto da própria moto. É ela a protagonista que a decisão de não usar
        imagem de fabricante deixou em aberto — sem foto, entra a silhueta da
        categoria, que identifica o tipo mas não a moto da pessoa.

        Sem `capture` de propósito, ao contrário da foto da nota: nota se
        fotografa na hora, a moto quase sempre já está no rolo da câmera. Com
        `capture`, o celular pula a galeria e abre direto a câmera.
      */}
      <div className="mb-5">
        <Rotulo>Foto da moto</Rotulo>
        <div className="mt-2 flex items-center gap-3">
          <div className="palco flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            {foto ? (
              <img src={foto} alt="Foto da sua moto" className="h-full w-full object-cover" />
            ) : (
              <SilhuetaMoto
                categoria={escolhido?.categoria}
                className="h-[70%] w-auto text-superficie3"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <button
              type="button"
              className="btn-escuro w-full"
              disabled={preparandoFoto}
              onClick={() => entradaFoto.current?.click()}
            >
              <IcoCamera className="h-5 w-5" />
              {preparandoFoto ? 'Preparando…' : foto ? 'Trocar foto' : 'Adicionar foto'}
            </button>

            {foto && (
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-micro text-textoFraco">{pesoAproximado(foto)}</span>
                <button
                  type="button"
                  className="text-micro text-textoSec underline underline-offset-4"
                  onClick={() => setFoto(null)}
                >
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>

        <input
          ref={entradaFoto}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Escolher foto da moto"
          onChange={(e) => escolherFoto(e.target.files?.[0])}
        />
      </div>

      <div className="space-y-4">
        {!escolhido && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="rotulo">Marca</span>
              <input className="campo" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Honda" />
            </label>
            <label className="block">
              <span className="rotulo">Modelo</span>
              <input className="campo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="CG 160" />
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="rotulo">Ano</span>
            <input
              className="campo tabular-nums"
              value={ano}
              onChange={(e) => setAno(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="2026"
            />
          </label>
          <label className="block">
            <span className="rotulo">Cor</span>
            <input className="campo" value={cor} onChange={(e) => setCor(e.target.value)} placeholder="Preta" />
          </label>
        </div>

        <label className="block">
          <span className="rotulo">Apelido</span>
          <input
            className="campo"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="Como você chama ela"
          />
        </label>

        <label className="block">
          <span className="rotulo">Placa</span>
          <input
            className="campo uppercase"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="ABC1D23"
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className="rotulo">Km de hoje</span>
          <input
            className="campo text-xl font-bold tabular-nums"
            value={kmInicial}
            onChange={(e) => setKmInicial(e.target.value.replace(/\D/g, '').slice(0, 7))}
            inputMode="numeric"
            placeholder="12500"
          />
          <span className="mt-1 block text-micro text-textoFraco">
            O que está marcando no painel agora.
          </span>
        </label>

        <div>
          <Rotulo>Como você usa a moto</Rotulo>
          <div className="mt-2">
            <Alternador opcoes={PERFIS} valor={perfil} aoTrocar={setPerfil} />
          </div>
          <p className="mt-2 text-micro text-textoSec">{EXPLICACAO_PERFIL[perfil]}</p>
          {fator !== 1 && (
            <p className="mt-1 text-micro font-semibold text-primaria">
              Intervalos multiplicados por {String(fator).replace('.', ',')}.
            </p>
          )}
        </div>

        {!editando && (
          <div className="rounded-xl border border-borda bg-superficie p-3.5">
            <p className="text-sm font-semibold">Vai junto no cadastro</p>
            <p className="mt-1 text-corpo text-textoSec">
              16 itens de manutenção de moto — óleo, corrente, freio, pneu, vela — com intervalos
              já preenchidos, prontos para ajustar.
            </p>
            <div className="mt-2">
              <Aviso>
                Os intervalos são referência genérica de uso urbano. Confira no manual da sua moto.
              </Aviso>
            </div>
          </div>
        )}

        {editando && original && original.perfil_uso !== perfil && (
          <Aviso>
            Trocar o perfil recalcula só os itens que você ainda não editou. Os que você confirmou
            no manual ficam como estão.
          </Aviso>
        )}
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-conteudo border-t border-borda bg-bg px-4 pt-3">
        <button
          type="button"
          className="btn-laranja w-full text-lg"
          disabled={!podeSalvar || salvando}
          onClick={salvar}
        >
          {editando ? 'SALVAR' : 'CADASTRAR E COMEÇAR'}
        </button>
      </div>
    </div>
  )
}
