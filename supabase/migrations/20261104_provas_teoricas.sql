-- Percentual de acerto da prova teorica por turma (turmas = eventos do cronograma).
create table if not exists public.provas_teoricas (
  id            uuid primary key default gen_random_uuid(),
  evento_id     uuid not null unique references public.cronograma_eventos(id) on delete cascade,
  percentual    numeric(5,2) check (percentual is null or (percentual >= 0 and percentual <= 100)),
  observacao    text,
  atualizado_por uuid references auth.users(id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.provas_teoricas enable row level security;

drop policy if exists provas_teoricas_select on public.provas_teoricas;
create policy provas_teoricas_select on public.provas_teoricas
  for select to authenticated using (true);

drop policy if exists provas_teoricas_insert on public.provas_teoricas;
create policy provas_teoricas_insert on public.provas_teoricas
  for insert to authenticated with check (true);

drop policy if exists provas_teoricas_update on public.provas_teoricas;
create policy provas_teoricas_update on public.provas_teoricas
  for update to authenticated using (true) with check (true);

drop policy if exists provas_teoricas_delete on public.provas_teoricas;
create policy provas_teoricas_delete on public.provas_teoricas
  for delete to authenticated using (public.is_admin());
