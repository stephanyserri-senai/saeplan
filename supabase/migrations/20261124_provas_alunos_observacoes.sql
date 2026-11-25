alter table public.provas_objetivas_alunos
  add column if not exists observacoes text;

alter table public.provas_praticas
  add column if not exists observacoes text;
