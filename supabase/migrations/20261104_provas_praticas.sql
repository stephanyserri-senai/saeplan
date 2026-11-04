-- Acompanhamento da aplicacao de provas praticas (por turma e aluno).
create table if not exists public.provas_praticas (
  id              uuid primary key default gen_random_uuid(),
  turma           text not null,
  aluno           text not null,
  data_aplicacao  date,
  evidencia_url   text,
  evidencia_nome  text,
  criado_por      uuid references auth.users(id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists provas_praticas_turma_idx on public.provas_praticas (turma);

alter table public.provas_praticas enable row level security;

drop policy if exists provas_praticas_select on public.provas_praticas;
create policy provas_praticas_select on public.provas_praticas
  for select to authenticated using (true);

drop policy if exists provas_praticas_insert on public.provas_praticas;
create policy provas_praticas_insert on public.provas_praticas
  for insert to authenticated with check (true);

drop policy if exists provas_praticas_update on public.provas_praticas;
create policy provas_praticas_update on public.provas_praticas
  for update to authenticated
  using (criado_por = auth.uid() or public.is_admin())
  with check (criado_por = auth.uid() or public.is_admin());

drop policy if exists provas_praticas_delete on public.provas_praticas;
create policy provas_praticas_delete on public.provas_praticas
  for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());
