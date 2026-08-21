# DiasdMoto

O caderno de manutenção da sua moto. Histórico, previsão do que está vencendo e
quanto a moto custa — funcionando offline, sem login e sem mensalidade.

**No ar:** https://luisyoungg777-sudo.github.io/diasdmoto/

No celular, o navegador oferece "Adicionar à tela de início" — aí o DiasdMoto abre
em janela própria e funciona sem internet.

## Rodar

Precisa do **Node.js 22.22.2 ou mais novo** — há um `.nvmrc` pedindo o 24, que
é o que o CI usa.

Não é capricho de versão: o `jsdom`, que roda os testes de interface, declara
`engines.node = "^22.22.2 || ^24.15.0 || >=26"`. Em Node 20 ele nem carrega —
o `undici` procura `worker_threads.markAsUncloneable`, que só existe a partir
do 22, e quebra antes de qualquer teste rodar. O sintoma é cruel: `npm test`
sai com erro sem apontar um teste sequer.

```bash
npm install
```

```bash
npm run dev
```

Abre em `http://localhost:5173`.

Outros comandos:

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run build
```

## Como está montado

```
src/
  data/
    catalogo-padrao.ts   16 itens de manutenção de moto e seus intervalos genéricos
    dicionario.ts        palavras que o parser de frase entende
    motos-br.ts          modelos populares no Brasil, só para autocomplete
  db/
    db.ts                Dexie (IndexedDB) — o banco de verdade do app
    repos.ts             escrita, soft delete e fila de sincronização
  services/
    parser.ts            frase curta → lançamento (o diferencial do produto)
    calculos.ts          km estimado, vencimentos, consumo, custos
    voz.ts               Web Speech API, com desligamento silencioso
    pdf.ts               relatório para mostrar ao comprador
    leitorNota.ts        integração de OCR — DESLIGADA
    consultaPlaca.ts     integração de placa — DESLIGADA
  paginas/               Home, Histórico, Custos, Ajustes, cadastro, itens
  components/            folha deslizante, cartão de lançamento, gráfico
```

### Local primeiro

Toda escrita vai para o IndexedDB na hora e entra numa fila (`sync_queue`) para
subir depois. Cada registro tem `id` (uuid do cliente), `updated_at` e
`deleted_at` — nada é apagado de verdade, e conflito resolve pelo `updated_at`
mais recente. Sem login o app funciona igual; só não tem backup na nuvem.

### Os dois carimbos de tempo

São duas datas com papéis opostos, e trocar uma pela outra custa dado:

| | de quem | serve para |
|---|---|---|
| `updated_at` | relógio de **quem escreveu** | desempatar conflito |
| `synced_at` | relógio do **servidor**, na chegada | mover a marca d'água da sincronização |

"Qual das duas versões é a mais nova" só faz sentido no tempo de quem editou —
por isso `updated_at` vem do cliente, e o banco só o preenche se vier nulo.
"O que eu ainda não vi" só faz sentido num relógio só, o mesmo para todos os
aparelhos — por isso `synced_at` é carimbado pelo gatilho a cada gravação, e o
que o cliente mandar nesse campo é ignorado.

A primeira versão usava `updated_at` para as duas coisas, comparando o relógio
de quem lê contra o relógio de quem escreve. Isso escondia de um aparelho todo
registro que o outro tivesse feito **offline** antes da última sincronização
dele: o celular anota às 09:30 sem sinal, sobe às 11:00, e o PC — que
sincronizou às 10:00 — pergunta "o que mudou depois das 10:00" e nunca mais
enxerga aquele registro. Num app offline-first esse era o caminho principal,
não a borda. `src/services/sincronizacao.integracao.test.ts` prende o cenário.

A marca d'água também é guardada **por conta** (`sync.ultima:<user_id>`). Sem
isso, entrar com outra conta no mesmo aparelho herdava a marca da anterior e o
histórico antigo da conta nova nunca descia.

### Sobre os intervalos de manutenção

Os intervalos que vêm prontos são **referência genérica de uso urbano**, não o
manual de nenhuma moto específica. Todo item nasce com `fonte: 'padrao'` e a
tela mostra *"valor genérico — confirme no manual da sua moto"* até você editar
o intervalo — aí ele vira `manual_fabricante` e o aviso some.

O perfil de uso encurta os intervalos dos itens ainda genéricos: urbano pesado
×0,7, trilha ×0,5.

## Integrações desligadas

Nada de pago roda hoje. Para ligar no futuro, preencha o `.env` (veja
`.env.example`) — a fábrica em cada serviço troca sozinha da implementação nula
para a real:

| Integração | Variável | Comportamento hoje |
|---|---|---|
| Leitura de nota por IA | `VITE_OCR_ENDPOINT` | guarda a foto, não lê nada |
| Consulta por placa | `VITE_PLACA_ENDPOINT` | autocomplete local de modelos |

Mesmo ligadas, elas nunca salvam sozinhas: preenchem o formulário e o usuário
confirma.

## Publicar

O app é estático: qualquer hospedagem de arquivo serve, e todas as opções
abaixo são gratuitas.

### GitHub Pages

Já existe o workflow em `.github/workflows/pages.yml`. Ele roda os testes e o
typecheck antes de publicar — se algo quebrar, nada vai pro ar.

1. Crie um repositório no GitHub e empurre este projeto.
2. No repositório: **Settings → Pages → Source → GitHub Actions**.
3. Pronto. Cada push na branch principal republica sozinho.

A URL fica `https://SEU-USUARIO.github.io/NOME-DO-REPO/`. O `base: './'` no
`vite.config.ts` e o roteamento por hash fazem funcionar em subdiretório sem
ajuste nenhum.

### Cloudflare Pages

Serve na raiz de um domínio em vez de num subdiretório, e dá uma URL curta
(`diasdmoto.pages.dev`). Nada no código muda: o `base: './'` é relativo e o
roteamento por hash dispensa regra de fallback de SPA — conferido servindo o
`dist` na raiz.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create** → **Pages** → **Connect to Git**, e escolha o repositório.
2. Preencha:

   | Campo | Valor |
   |---|---|
   | Project name | `diasdmoto` — é ele que vira `diasdmoto.pages.dev` |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

3. Em **Environment variables**, adicione **`NODE_VERSION` = `20`**. Sem isso o
   Cloudflare usa uma versão antiga do Node e o build quebra. É a única
   variável necessária: as chaves do Supabase vêm de `.env.production`,
   versionado.
4. **Save and Deploy**.

Os dois deploys convivem — o GitHub Pages continua publicando na mesma URL de
sempre, e cada push republica os dois.

### Vercel ou Netlify

Importe o repositório. Build `npm run build`, diretório `dist`. Nenhuma
variável de ambiente é obrigatória.

### Instalar como app

Depois de publicado em HTTPS, o navegador oferece "Instalar" ou "Adicionar à
tela de início". Aí o DiasdMoto abre em janela própria, com ícone, e funciona
offline — o service worker guarda tudo em cache.

Service worker **exige HTTPS** (ou localhost). Aberto por `file://` o app roda,
mas não instala.

### Um arquivo só, para compartilhar rápido

```bash
DIASDMOTO_ARQUIVO_UNICO=1 npx vite build
```

Gera `dist-unico/index.html` com tudo embutido, para mandar por link ou anexo.
Nesse formato não há service worker, então não instala nem funciona offline —
e download de PDF e de backup não funcionam dentro de iframe.

## Backup na nuvem (opcional)

O app funciona inteiro sem conta. O login existe só para copiar seus dados
para a nuvem e recuperá-los em outro aparelho.

Para ligar:

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Rode `supabase/schema.sql` no editor SQL do projeto — ele cria as tabelas,
   os índices e as políticas de RLS, e pode ser rodado de novo sem quebrar.
3. Copie a URL e a chave `anon` do projeto para o `.env`.

Sem essas duas variáveis, a tela de conta explica o que falta e o resto do app
segue funcionando offline.

As políticas de RLS ficam no banco, não no frontend: cada tabela só devolve
linha cujo `user_id` seja o do usuário autenticado, e o `with check` no insert
impede gravar linha em nome de outra pessoa.

> **A ordem importa: primeiro o SQL, depois o deploy.** O app agora filtra o
> download por `synced_at`. Num banco que ainda não tem essa coluna, a consulta
> falha e a sincronização para — com a fila intacta, sem perder nada, mas
> parada. Rode `supabase/schema.sql` **antes** de empurrar para a `main`.
>
> O arquivo continua idempotente. Rodá-lo num banco que já existe adiciona a
> coluna às tabelas de lá e carimba `now()` em toda linha existente: cada
> aparelho baixa a nuvem inteira uma vez e para. Baixar de novo não apaga nada
> — o desempate por `updated_at` mantém o que já está no aparelho.

### Testar entre dois aparelhos

O caminho de rede da sincronização é o único que os testes não alcançam. O
roteiro abaixo exercita os dois sentidos e o conflito, e leva uns dez minutos.

Antes: rode o `schema.sql`, publique, e entre com **a mesma conta** nos dois
aparelhos. Os cartões de sincronização são a instrumentação — leia o estado
depois de cada passo.

1. **Sobe.** No PC, cadastre uma moto. Toque **Sincronizar agora**.
   No celular, **Sincronizar agora** → a moto tem que aparecer.
2. **Desce.** No celular, registre um abastecimento. Sincronize nos dois.
   O abastecimento tem que aparecer no PC.
3. **Offline — o passo que importa.** Ponha o **celular em modo avião** e
   registre um serviço nele. Ainda em modo avião, **sincronize no PC** (isso
   move a marca d'água do PC para depois da hora do serviço). Só então tire o
   avião, sincronize o celular, e sincronize o PC de novo.
   **O serviço tem que chegar no PC.** Era exatamente aqui que ele sumia.
4. **Conflito.** Com os dois offline, edite o apelido da mesma moto nos dois,
   com textos diferentes — no celular primeiro, no PC uns minutos depois.
   Religue e sincronize os dois, duas vezes cada. Os dois têm que convergir
   para a versão do **PC**, que é a de `updated_at` mais recente.
5. **Rede caindo no meio.** Registre algo com o aparelho offline e sincronize:
   o cartão tem que mostrar as alterações pendentes, e nada pode sumir.

Se algum passo divergir, **Está faltando algo? Baixar a nuvem de novo** na tela
de conta zera a marca d'água e baixa tudo outra vez. Ele nunca apaga o que está
no aparelho.

## Imagens do catálogo

`imagemUrl` fica vazio de propósito em todos os modelos. Puxar imagem do site
do fabricante seria hotlink de conteúdo de terceiro, as URLs apodrecem, e a
foto sumiria justo offline — que é quando o app mais é usado. Então a foto do
próprio usuário é a protagonista, guardada local, e o placeholder cobre o
resto. Os campos `imagemUrl` e `fonteUrl` existem para quando houver imagem
autorizada.

## O que ainda não está pronto

- **Fase 4** — redesign das telas, garagem, detalhe da moto e a sincronização
  bidirecional drenando a `sync_queue`.
- **Fase 5** — PWA instalável, revisão de acessibilidade, publicação.
