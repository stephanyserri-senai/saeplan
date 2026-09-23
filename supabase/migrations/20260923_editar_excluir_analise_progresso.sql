-- Permite que o autor ou um administrador substitua/exclua uma análise.
drop policy if exists analises_progresso_update_own on public.analises_progresso;
create policy analises_progresso_update_own on public.analises_progresso
  for update to authenticated
  using (importado_por = auth.uid() or public.is_admin())
  with check (importado_por = auth.uid() or public.is_admin());

drop policy if exists analises_progresso_delete_own on public.analises_progresso;
create policy analises_progresso_delete_own on public.analises_progresso
  for delete to authenticated
  using (importado_por = auth.uid() or public.is_admin());
