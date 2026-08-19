# Motoon

O caderno de manutenção da sua moto. Histórico, previsão do que está vencendo e
quanto a moto custa — funcionando offline, sem login e sem mensalidade.

## Rodar

Precisa do Node.js 20 ou mais novo.

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

### Vercel ou Netlify

Importe o repositório. Build `npm run build`, diretório `dist`. Nenhuma
variável de ambiente é obrigatória.

### Instalar como app

Depois de publicado em HTTPS, o navegador oferece "Instalar" ou "Adicionar à
tela de início". Aí o Motoon abre em janela própria, com ícone, e funciona
offline — o service worker guarda tudo em cache.

Service worker **exige HTTPS** (ou localhost). Aberto por `file://` o app roda,
mas não instala.

### Um arquivo só, para compartilhar rápido

```bash
MOTOON_ARQUIVO_UNICO=1 npx vite build
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
