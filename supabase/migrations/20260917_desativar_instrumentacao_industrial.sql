-- Remove o curso antigo do catalogo sem apagar analises que possam referencia-lo.
create extension if not exists unaccent;

update public.cursos
set ativo = false,
    updated_at = now()
where nome = 'Instrumentação Industrial';

update public.cursos
set ativo = false,
    updated_at = now()
where unaccent(lower(trim(nome))) = 'instrumentacao industrial';