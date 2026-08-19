-- =====================================================================
-- Motoon — schema e politicas de acesso
--
-- Rode este arquivo inteiro no editor SQL do seu projeto Supabase.
-- Ele e idempotente: rodar duas vezes nao quebra nada.
--
-- Principio: o Dexie no aparelho continua sendo a fonte local. Estas
-- tabelas sao copia de seguranca. O `id` vem do cliente (uuid gerado la),
-- entao o mesmo registro tem o mesmo id no celular e aqui.
--
-- REGRA QUE NAO SE NEGOCIA: nunca confiar no frontend. Toda tabela liga
-- RLS e so devolve linha cujo user_id seja o do usuario autenticado.
-- =====================================================================

-- ------------------------------------------------------------ tabelas

create table if not exists public.motos (
  id                    uuid primary key,
  user_id               uuid not null references auth.users (id) on delete cascade,
  apelido               text not null default '',
  marca                 text not null default '',
  modelo                text not null default '',
  ano                   integer,
  placa                 text not null default '',
  cor                   text not null default '',
  km_inicial            integer not null default 0,
  foto_url              text,
  criada_em             date not null,
  arquivada             boolean not null default false,
  perfil_uso            text not null default 'urbano_leve',
  -- vindos do catalogo; opcionais para nao quebrar moto cadastrada antes
  catalogo_id           text,
  catalogo_marca        text,
  catalogo_modelo       text,
  catalogo_categoria    text,
  catalogo_ano          integer,
  catalogo_imagem_url   text,
  catalogo_fonte_url    text,
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create table if not exists public.itens_manutencao (
  id             uuid primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  moto_id        uuid not null,
  nome           text not null,
  categoria      text not null,
  intervalo_km   integer,
  intervalo_dias integer,
  ativo          boolean not null default true,
  observacao     text not null default '',
  fonte          text not null default 'padrao',
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create table if not exists public.leituras_odometro (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  moto_id    uuid not null,
  km         integer not null,
  data       date not null,
  origem     text not null default 'manual',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.servicos (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  moto_id     uuid not null,
  item_id     uuid,
  descricao   text not null default '',
  data        date not null,
  km          integer,
  valor       numeric(12, 2),
  local       text not null default '',
  observacao  text not null default '',
  foto_url    text,
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.abastecimentos (
  id               uuid primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  moto_id          uuid not null,
  data             date not null,
  km               integer,
  litros           numeric(10, 3),
  valor_total      numeric(12, 2),
  valor_litro      numeric(10, 3),
  tipo_combustivel text not null default 'gasolina',
  tanque_cheio     boolean not null default false,
  posto            text not null default '',
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.despesas (
  id         uuid primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  moto_id    uuid not null,
  data       date not null,
  categoria  text not null default 'outro',
  descricao  text not null default '',
  valor      numeric(12, 2),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ------------------------------------------------------------- indices
-- A sincronizacao puxa "o que mudou desde X", entao o par (user_id,
-- updated_at) e o caminho quente de leitura.

create index if not exists motos_user_atualizado_idx
  on public.motos (user_id, updated_at desc);
create index if not exists itens_user_atualizado_idx
  on public.itens_manutencao (user_id, updated_at desc);
create index if not exists leituras_user_atualizado_idx
  on public.leituras_odometro (user_id, updated_at desc);
create index if not exists servicos_user_atualizado_idx
  on public.servicos (user_id, updated_at desc);
create index if not exists abastecimentos_user_atualizado_idx
  on public.abastecimentos (user_id, updated_at desc);
create index if not exists despesas_user_atualizado_idx
  on public.despesas (user_id, updated_at desc);

create index if not exists itens_moto_idx on public.itens_manutencao (moto_id);
create index if not exists leituras_moto_idx on public.leituras_odometro (moto_id);
create index if not exists servicos_moto_idx on public.servicos (moto_id);
create index if not exists abastecimentos_moto_idx on public.abastecimentos (moto_id);
create index if not exists despesas_moto_idx on public.despesas (moto_id);

-- ------------------------------------------------- RLS: uma politica so
-- Cada tabela recebe as quatro operacoes com a mesma condicao. O `with
-- check` no insert e no update e o que impede alguem autenticado de
-- gravar linha com o user_id de outra pessoa.

do $$
declare
  t text;
begin
  foreach t in array array[
    'motos', 'itens_manutencao', 'leituras_odometro',
    'servicos', 'abastecimentos', 'despesas'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_selecionar', t);
    execute format('drop policy if exists %I on public.%I', t || '_inserir', t);
    execute format('drop policy if exists %I on public.%I', t || '_atualizar', t);
    execute format('drop policy if exists %I on public.%I', t || '_apagar', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      t || '_selecionar', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      t || '_inserir', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t || '_atualizar', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)',
      t || '_apagar', t
    );
  end loop;
end
$$;

-- --------------------------------------- carimbo de updated_at no banco
-- O cliente manda o updated_at dele, que e quem resolve conflito. Este
-- gatilho so garante que ninguem grave uma linha sem carimbo nenhum.

create or replace function public.carimbar_atualizacao()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at is null then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'motos', 'itens_manutencao', 'leituras_odometro',
    'servicos', 'abastecimentos', 'despesas'
  ]
  loop
    execute format('drop trigger if exists carimbar on public.%I', t);
    execute format(
      'create trigger carimbar before insert or update on public.%I
         for each row execute function public.carimbar_atualizacao()', t
    );
  end loop;
end
$$;
