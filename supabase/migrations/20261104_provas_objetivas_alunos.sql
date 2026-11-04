-- Percentual de acerto por aluno na prova objetiva (importado de planilha).
create table if not exists public.provas_objetivas_alunos (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references public.cronograma_eventos(id) on delete cascade,
  aluno       text not null,
  percentual  numeric(5,2) not null check (percentual >= 0 and percentual <= 100),
  criado_por  uuid references auth.users(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (evento_id, aluno)
);

create index if not exists provas_objetivas_alunos_evento_idx on public.provas_objetivas_alunos (evento_id);

alter table public.provas_objetivas_alunos enable row level security;

drop policy if exists provas_objetivas_alunos_select on public.provas_objetivas_alunos;
create policy provas_objetivas_alunos_select on public.provas_objetivas_alunos
  for select to authenticated using (true);

drop policy if exists provas_objetivas_alunos_insert on public.provas_objetivas_alunos;
create policy provas_objetivas_alunos_insert on public.provas_objetivas_alunos
  for insert to authenticated with check (true);

drop policy if exists provas_objetivas_alunos_update on public.provas_objetivas_alunos;
create policy provas_objetivas_alunos_update on public.provas_objetivas_alunos
  for update to authenticated using (true) with check (true);

drop policy if exists provas_objetivas_alunos_delete on public.provas_objetivas_alunos;
create policy provas_objetivas_alunos_delete on public.provas_objetivas_alunos
  for delete to authenticated using (criado_por = auth.uid() or public.is_admin());
