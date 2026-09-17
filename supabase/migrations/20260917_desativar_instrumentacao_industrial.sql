-- Remove o curso antigo do catalogo sem apagar analises que possam referencia-lo.
update public.cursos
set ativo = false,
    updated_at = now()
where nome = 'Instrumentação Industrial';

update public.cursos
set ativo = false,
    updated_at = now()
where lower(trim(nome)) = 'instrumentação industrial';