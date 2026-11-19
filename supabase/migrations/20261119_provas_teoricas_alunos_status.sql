-- Situacao individual dos alunos na prova teorica.
alter table public.provas_objetivas_alunos
  add column if not exists realizada boolean not null default false,
  add column if not exists justificativa text;
