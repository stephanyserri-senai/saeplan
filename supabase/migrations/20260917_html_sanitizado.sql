-- Preserva o relatorio importado em formato seguro para exibicao posterior.
alter table public.analises_progresso
  add column if not exists html_sanitizado text;