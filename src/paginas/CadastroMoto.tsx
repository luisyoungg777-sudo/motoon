import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alternador, Aviso, Campo } from '@/components/ui'
import { IcoVoltar } from '@/components/icones'
import { buscarModelos } from '@/services/catalogoMotos'
import { criarMoto, obterMoto, recalcularItensPadrao, salvarMoto } from '@/db/repos'
import { useMoto } from '@/estado'
import { formatarPlaca } from '@/services/formato'
import { FATOR_PERFIL, type Moto, type PerfilUso } from '@/types'

const PERFIS: { valor: PerfilUso; rotulo: string }[] = [
  { valor: 'urbano_leve', rotulo: 'Urbano leve' },
  { valor: 'urbano_pesado', rotulo: 'Urbano pesado' },
  { valor: 'trilha', rotulo: 'Trilha / terra' },
]

const EXPLICACAO_PERFIL: Record<PerfilUso, string> = {
  urbano_leve: 'Uso normal. Os intervalos ficam como a referência genérica.',
  urbano_pesado:
    'Rodar o dia todo, muito para-e-anda, entrega. Os intervalos entram encurtados em 30%.',
  trilha: 'Terra, barro, poeira. Os intervalos entram pela metade.',
}

export default function CadastroMoto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { trocarMoto } = useMoto()
  const editando = Boolean(id)

  const [motoOriginal, setMotoOriginal] = useState<Moto | null>(null)
  const [apelido, setApelido] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [placa, setPlaca] = useState('')
  const [cor, setCor] = useState('')
  const [kmInicial, setKmInicial] = useState('')
  const [perfil, setPerfil] = useState<PerfilUso>('urbano_leve')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    obterMoto(id).then((m) => {
      if (!m) return
      setMotoOriginal(m)
      setApelido(m.apelido)
      setMarca(m.marca)
      setModelo(m.modelo)
      setAno(m.ano ? String(m.ano) : '')
      setPlaca(m.placa)
      setCor(m.cor)
      setKmInicial(String(m.km_inicial))
      setPerfil(m.perfil_uso)
    })
  }, [id])

  const sugestoes = useMemo(() => (modelo.length >= 2 ? buscarModelos(modelo) : []), [modelo])
  const podeSalvar = modelo.trim().length > 0 || apelido.trim().length > 0

  async function salvar() {
    if (!podeSalvar || salvando) return
    setSalvando(true)

    const dados = {
      apelido: apelido.trim() || modelo.trim(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: ano ? Number(ano) : null,
      placa: formatarPlaca(placa),
      cor: cor.trim(),
      km_inicial: Number(kmInicial) || 0,
      foto_url: null,
      perfil_uso: perfil,
    }

    if (motoOriginal) {
      const perfilMudou = motoOriginal.perfil_uso !== perfil
      await salvarMoto({ ...motoOriginal, ...dados })
      if (perfilMudou) await recalcularItensPadrao(motoOriginal.id, perfil)
      navegar('/config')
    } else {
      const nova = await criarMoto(dados)
      trocarMoto(nova.id)
      navegar('/')
    }
  }

  const fator = FATOR_PERFIL[perfil]

  return (
    <div className="min-h-screen px-4 pb-32 pt-4">
      <header className="mb-5 flex items-center gap-2">
        {editando && (
          <button
            type="button"
            onClick={() => navegar(-1)}
            aria-label="Voltar"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-apagado active:bg-painel2"
          >
            <IcoVoltar />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {editando ? 'Editar moto' : 'Cadastrar a moto'}
          </h1>
          {!editando && (
            <p className="text-sm text-apagado">Só o modelo já basta. O resto dá para preencher depois.</p>
          )}
        </div>
      </header>

      <div className="space-y-4">
        <Campo rotulo="Modelo">
          <input
            className="campo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="CG 160 Fan"
            autoComplete="off"
            enterKeyHint="next"
          />
        </Campo>

        {sugestoes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((s) => (
              <button
                key={`${s.marca}-${s.modelo}`}
                type="button"
                className="chip"
                onClick={() => {
                  setMarca(s.marca)
                  setModelo(s.modelo)
                  if (!apelido) setApelido(s.modelo)
                }}
              >
                {s.marca} {s.modelo}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Marca">
            <input
              className="campo"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Honda"
              autoComplete="off"
            />
          </Campo>
          <Campo rotulo="Ano">
            <input
              className="campo"
              value={ano}
              onChange={(e) => setAno(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              placeholder="2022"
            />
          </Campo>
        </div>

        <Campo rotulo="Apelido" dica="Como você chama ela. Aparece na home.">
          <input
            className="campo"
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder="Fanzoca"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Placa">
            <input
              className="campo uppercase"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase().slice(0, 8))}
              placeholder="ABC1D23"
              autoComplete="off"
            />
          </Campo>
          <Campo rotulo="Cor">
            <input
              className="campo"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              placeholder="Preta"
            />
          </Campo>
        </div>

        <Campo rotulo="Km de hoje" dica="O que está marcando no painel agora.">
          <input
            className="campo"
            value={kmInicial}
            onChange={(e) => setKmInicial(e.target.value.replace(/\D/g, '').slice(0, 7))}
            inputMode="numeric"
            placeholder="12500"
          />
        </Campo>

        <div>
          <span className="rotulo">Como você usa a moto</span>
          <Alternador opcoes={PERFIS} valor={perfil} aoTrocar={setPerfil} />
          <p className="mt-2 text-xs leading-snug text-apagado">{EXPLICACAO_PERFIL[perfil]}</p>
          {fator !== 1 && (
            <p className="mt-1 text-xs font-bold text-laranja">
              Intervalos multiplicados por {String(fator).replace('.', ',')} (uso severo).
            </p>
          )}
        </div>

        <div className="painel space-y-2 p-3">
          <p className="text-sm font-bold">O que vai ser criado junto</p>
          <p className="text-sm leading-snug text-apagado">
            Uma lista de 16 itens de manutenção de moto — óleo, corrente, freio, pneu, vela — com
            intervalos já preenchidos, prontos para você ajustar.
          </p>
          <Aviso>
            Os intervalos são referência genérica de uso urbano. Confira no manual da sua moto e
            edite em Ajustes → Itens de manutenção.
          </Aviso>
        </div>

        {editando && motoOriginal && motoOriginal.perfil_uso !== perfil && (
          <Aviso>
            Trocar o perfil recalcula só os itens que você ainda não editou. Os que você já
            confirmou no manual ficam como estão.
          </Aviso>
        )}
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 mx-auto max-w-lg border-t border-linha bg-bg px-4 pt-3">
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
