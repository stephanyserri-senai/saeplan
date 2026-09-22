-- Permite que administradores alterem nome, e-mail e perfil de outros usuários.
-- Colaboradores continuam impedidos de promover qualquer perfil a administrador.
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;

create policy profiles_update_own_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role = 'colaborador')
  );