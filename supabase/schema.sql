-- =========================================================================
-- Painel de Lançamento Avaner — schema.sql
-- Rode este arquivo inteiro UMA VEZ no SQL Editor do seu projeto Supabase
-- (Supabase → SQL Editor → New query → cole tudo → Run).
-- É seguro rodar mais de uma vez: todos os comandos são "idempotentes"
-- (usam IF NOT EXISTS / ON CONFLICT / blocos que ignoram erro de duplicado).
-- =========================================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------------
-- 1. TABELAS
-- -------------------------------------------------------------------------

-- Quadro de tarefas (as 34 tarefas do checklist do Guilherme, ver seed.sql)
create table if not exists public.tasks (
  id          text primary key,
  phase       text not null,
  title       text not null,
  detail      text,
  owner       text not null,        -- 'Michael' | 'Jamille' | 'Guilherme' | 'Michael/Jamille' | 'Equipe'
  due_date    date not null,
  sort_order  integer not null default 0,
  done        boolean not null default false,
  done_by     text,
  updated_at  timestamptz not null default now()
);

-- Metas do lançamento (uma única linha, id fixo 'main')
create table if not exists public.metrics (
  id              text primary key default 'main',
  revenue_current numeric not null default 0,
  group_count     numeric not null default 0,
  updated_at      timestamptz not null default now()
);
insert into public.metrics (id) values ('main') on conflict (id) do nothing;

-- Histórico diário das metas — alimenta o gráfico de evolução
create table if not exists public.metrics_history (
  id           bigserial primary key,
  day          date not null default current_date,
  revenue      numeric not null default 0,
  group_count  numeric not null default 0,
  created_at   timestamptz not null default now(),
  unique (day)
);

-- Materiais criativos do Guilherme (upload real OU link)
create table if not exists public.creative_assets (
  id            uuid primary key default gen_random_uuid(),
  phase         text,               -- fase do lançamento a que pertence (opcional)
  title         text not null,
  kind          text not null check (kind in ('upload', 'link')),
  storage_path  text,               -- caminho no bucket 'criativos' quando kind = 'upload'
  url           text,               -- link externo quando kind = 'link'
  uploaded_by   text,
  created_at    timestamptz not null default now()
);

-- Observações / andamento (mural de notas do time)
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  author      text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- Ferramenta interna de 3 pessoas: qualquer usuário autenticado (Michael,
-- Jamille, Guilherme) pode ler e escrever em tudo. Não há acesso público.
-- -------------------------------------------------------------------------

alter table public.tasks            enable row level security;
alter table public.metrics          enable row level security;
alter table public.metrics_history  enable row level security;
alter table public.creative_assets  enable row level security;
alter table public.notes            enable row level security;

do $$ begin
  create policy "tasks_all_authenticated" on public.tasks
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "metrics_all_authenticated" on public.metrics
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "metrics_history_all_authenticated" on public.metrics_history
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "creative_assets_all_authenticated" on public.creative_assets
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "notes_all_authenticated" on public.notes
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------------------
-- 3. REALTIME
-- Faz o painel atualizar sozinho, na hora, pra todo mundo (sem dar F5).
-- -------------------------------------------------------------------------

do $$ begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.metrics;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.metrics_history;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.creative_assets;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notes;
exception when duplicate_object then null; end $$;

-- -------------------------------------------------------------------------
-- 4. STORAGE — bucket para os criativos do Guilherme
-- Bucket público (leitura): simples de servir imagens/vídeos direto no
-- painel sem lidar com links assinados. Só usuário autenticado sobe/apaga
-- arquivo. Se um dia quiser deixar privado, é só trocar "public" pra false
-- e trocar getPublicUrl() por createSignedUrl() no js/creatives.js.
-- -------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('criativos', 'criativos', true)
on conflict (id) do nothing;

do $$ begin
  create policy "criativos_read_public" on storage.objects
    for select using (bucket_id = 'criativos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "criativos_write_authenticated" on storage.objects
    for insert to authenticated with check (bucket_id = 'criativos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "criativos_delete_authenticated" on storage.objects
    for delete to authenticated using (bucket_id = 'criativos');
exception when duplicate_object then null; end $$;

-- Fim. Depois de rodar isso, rode o seed.sql para popular as 34 tarefas.
