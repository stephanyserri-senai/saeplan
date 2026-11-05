-- Flag de realização da prova prática (substitui o anexo de evidência).
alter table public.provas_praticas
  add column if not exists realizada boolean not null default false;
