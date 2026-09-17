-- Cursos padrão do catálogo da Análise de Progresso.
insert into public.cursos (nome)
values
  ('ELETROTÉCNICA'),
  ('MECATRÔNICA'),
  ('INSTRUMENTAÇÃO'),
  ('AUTOMAÇÃO'),
  ('MECÂNICA AUTOMOTIVA'),
  ('LOGÍSTICA'),
  ('JOGOS DIGITAIS'),
  ('DESENVOLVIMENTO DE SISTEMAS')
on conflict (nome) do nothing;