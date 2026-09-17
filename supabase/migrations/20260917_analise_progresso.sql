-- Analise de Progresso: catalogo de cursos e snapshots historicos.
create table if not exists public.cursos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analises_progresso (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references public.cursos(id) on delete restrict,
  arquivo_nome text not null,
  data_analise date not null,
  importado_em timestamptz not null default now(),
  importado_por uuid references auth.users(id) on delete set null,
  resultado_percentual numeric(5,2) check (resultado_percentual is null or (resultado_percentual >= 0 and resultado_percentual <= 100)),
  dados_extraidos jsonb not null default '{}'::jsonb,
  indicadores jsonb not null default '{}'::jsonb,
  alertas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.cursos (nome)
select distinct trim(area)
from public.acoes
where area is not null and trim(area) <> ''
on conflict (nome) do nothing;

alter table public.cursos enable row level security;
alter table public.analises_progresso enable row level security;

drop policy if exists cursos_select_authenticated on public.cursos;
create policy cursos_select_authenticated on public.cursos
  for select to authenticated using (ativo = true or public.is_admin());

drop policy if exists cursos_manage_admin on public.cursos;
create policy cursos_manage_admin on public.cursos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists analises_progresso_select_authenticated on public.analises_progresso;
create policy analises_progresso_select_authenticated on public.analises_progresso
  for select to authenticated using (true);

drop policy if exists analises_progresso_insert_own on public.analises_progresso;
create policy analises_progresso_insert_own on public.analises_progresso
  for insert to authenticated
  with check (importado_por = auth.uid());

create index if not exists analises_progresso_curso_data_idx
  on public.analises_progresso (curso_id, data_analise, importado_em);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'analises_progresso'
  ) then
    alter publication supabase_realtime add table public.analises_progresso;
  end if;
end;
$$;

-- Execute esta migration no SQL Editor do Supabase antes de usar a nova aba.
