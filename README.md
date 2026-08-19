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

## O que ainda não está pronto

- **Fase 4** — Supabase: login por e-mail, tabelas espelho, RLS e sincronização.
- **Fase 5** — PWA instalável, revisão de acessibilidade, publicação.
