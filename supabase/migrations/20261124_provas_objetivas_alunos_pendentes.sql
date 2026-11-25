-- Alunos sem percentual podem ser registrados como pendentes.
alter table public.provas_objetivas_alunos
  alter column percentual drop not null,
  alter column realizada set default false;
