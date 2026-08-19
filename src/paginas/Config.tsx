import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Selo } from '@/components/ui'
import { IcoChave, IcoLapis, IcoMais, IcoPdf, IcoSeta } from '@/components/icones'
import { useMoto } from '@/estado'
import { apagarTudo, baixarBackup, exportarBackup, importarBackup } from '@/services/backup'
import { resumirCustos } from '@/services/calculos'
import { gerarRelatorioPdf } from '@/services/pdf'
import { ROTULO_PERFIL } from '@/types'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-black uppercase tracking-widest text-apagado">{titulo}</h2>
      {children}
    </section>
  )
}

export default function Config() {
  const { moto, motos, trocarMoto, servicos, abastecimentos, despesas, leituras, vencimentos, estimativa } =
    useMoto()
  const navegar = useNavigate()
  const entradaArquivo = useRef<HTMLInputElement>(null)
  const [recado, setRecado] = useState<string | null>(null)
  const [confirmandoApagar, setConfirmandoApagar] = useState(false)

  async function importar(arquivo: File | undefined) {
    if (!arquivo) return
    const r = await importarBackup(await arquivo.text())
    setRecado(r.ok ? 'Backup importado.' : (r.erro ?? 'Não deu para importar.'))
  }

  return (
    <div className="space-y-6 px-4 pb-8 pt-4">
      <h1 className="text-2xl font-black tracking-tight">Ajustes</h1>

      <Secao titulo="Motos">
        <ul className="space-y-2">
          {motos.map((m) => (
            <li key={m.id} className="painel flex items-center gap-2 p-3">
              <button
                type="button"
                onClick={() => trocarMoto(m.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-bold">
                  {m.apelido} {m.id === moto?.id && <Selo cor="laranja">ativa</Selo>}
                </p>
                <p className="truncate text-xs text-apagado">
                  {[m.marca, m.modelo, m.placa].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-apagado">Uso: {ROTULO_PERFIL[m.perfil_uso]}</p>
              </button>
              <button
                type="button"
                onClick={() => navegar(`/moto/${m.id}`)}
                aria-label={`Editar ${m.apelido}`}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-apagado active:bg-painel2"
              >
                <IcoLapis className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-escuro w-full" onClick={() => navegar('/moto/nova')}>
          <IcoMais className="h-5 w-5" />
          Cadastrar outra moto
        </button>
      </Secao>

      {moto && (
        <Secao titulo="Manutenção">
          <button
            type="button"
            className="painel flex w-full items-center gap-3 p-3 text-left active:bg-painel2"
            onClick={() => navegar(`/moto/${moto.id}/itens`)}
          >
            <IcoChave className="h-5 w-5 text-laranja" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Itens e intervalos</p>
              <p className="text-xs text-apagado">
                {vencimentos.length} itens · {vencimentos.filter((v) => v.item.fonte === 'padrao').length}{' '}
                ainda com valor genérico
              </p>
            </div>
            <IcoSeta className="h-5 w-5 text-apagado" />
          </button>

          {estimativa && (
            <button
              type="button"
              className="btn-escuro w-full"
              onClick={() =>
                gerarRelatorioPdf({
                  moto,
                  servicos,
                  vencimentos,
                  kmAtual: estimativa.km,
                  totalGasto: resumirCustos(
                    servicos,
                    abastecimentos,
                    despesas,
                    leituras,
                    null,
                    null,
                  ).total,
                })
              }
            >
              <IcoPdf className="h-5 w-5" />
              GERAR PDF do histórico
            </button>
          )}
        </Secao>
      )}

      <Secao titulo="Backup">
        <div className="painel space-y-2 p-3">
          <p className="text-sm leading-snug text-apagado">
            Tudo fica guardado só no seu aparelho. Se você limpar os dados do navegador ou trocar de
            celular, leva o arquivo junto.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-escuro flex-1"
              onClick={async () => baixarBackup(await exportarBackup())}
            >
              Exportar
            </button>
            <button
              type="button"
              className="btn-escuro flex-1"
              onClick={() => entradaArquivo.current?.click()}
            >
              Importar
            </button>
          </div>
          <input
            ref={entradaArquivo}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => importar(e.target.files?.[0])}
          />
          {recado && <p className="text-sm text-laranja">{recado}</p>}
        </div>
      </Secao>

      <Secao titulo="Backup na nuvem">
        <div className="painel space-y-1 p-3">
          <p className="text-sm font-bold">Ainda não ligado</p>
          <p className="text-sm leading-snug text-apagado">
            O login é opcional e serve só para copiar seus dados para a nuvem. Nada sai do aparelho
            enquanto você não entrar.
          </p>
        </div>
      </Secao>

      <Secao titulo="Zona de perigo">
        {confirmandoApagar ? (
          <div className="painel space-y-2 p-3">
            <p className="text-sm">
              Isso apaga <strong>tudo</strong>: motos, serviços, abastecimentos e despesas. Não tem
              como voltar atrás. Exporte um backup antes.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-escuro flex-1"
                onClick={() => setConfirmandoApagar(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn flex-1 bg-vermelho font-bold text-white"
                onClick={async () => {
                  await apagarTudo()
                  window.location.hash = '#/'
                  window.location.reload()
                }}
              >
                Apagar tudo
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-fantasma w-full text-vermelho"
            onClick={() => setConfirmandoApagar(true)}
          >
            Apagar todos os dados
          </button>
        )}
      </Secao>

      <p className="pt-4 text-center text-xs text-apagado">Motoon · funciona sem internet</p>
    </div>
  )
}
