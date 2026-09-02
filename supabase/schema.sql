-- =====================================================================
-- Plano de Ação — SAEP | Esquema do banco (Supabase / PostgreSQL)
-- Cole tudo isto no SQL Editor do Supabase e execute uma vez.
-- =====================================================================

-- ---------- Tabela de perfis (1 por usuário autenticado) -------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  nome       text,
  role       text not null default 'colaborador' check (role in ('colaborador','admin')),
  created_at timestamptz not null default now()
);

-- ---------- Tabela de ações ------------------------------------------
create table if not exists public.acoes (
  id          uuid primary key default gen_random_uuid(),
  titulo      text,
  descricao   text not null,
  responsavel text not null,
  area        text,
  prazo       date,
  status      text not null default 'Não iniciada'
              check (status in ('Não iniciada','Em andamento','Concluída','Atrasada')),
  evidencia   text,
  owner       uuid not null references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Cria o perfil automaticamente ao cadastrar ---------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Atualiza updated_at automaticamente ----------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists acoes_set_updated_at on public.acoes;
create trigger acoes_set_updated_at
  before update on public.acoes
  for each row execute function public.set_updated_at();

-- ---------- Função auxiliar: o usuário atual é admin? ----------------
create or replace function public.is_admin()
returns boolean
language sql
security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- Segurança em nível de linha (RLS) ------------------------
alter table public.profiles enable row level security;
alter table public.acoes    enable row level security;

-- profiles: todos autenticados leem (para exibir nomes); cada um edita o seu
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid());

-- acoes: todos autenticados veem todas (transparência + acompanhamento)
drop policy if exists acoes_select_all on public.acoes;
create policy acoes_select_all on public.acoes
  for select to authenticated using (true);

-- inserir: só a própria pessoa como owner
drop policy if exists acoes_insert_own on public.acoes;
create policy acoes_insert_own on public.acoes
  for insert to authenticated with check (owner = auth.uid());

-- editar: o dono da ação ou um admin
drop policy if exists acoes_update_own_or_admin on public.acoes;
create policy acoes_update_own_or_admin on public.acoes
  for update to authenticated
  using (owner = auth.uid() or public.is_admin())
  with check (owner = auth.uid() or public.is_admin());

-- excluir: o dono da ação ou um admin
drop policy if exists acoes_delete_own_or_admin on public.acoes;
create policy acoes_delete_own_or_admin on public.acoes
  for delete to authenticated
  using (owner = auth.uid() or public.is_admin());

-- ---------- Atualização em tempo real --------------------------------
alter publication supabase_realtime add table public.acoes;

-- =====================================================================
-- DEPOIS de criar sua conta pelo app, rode a linha abaixo (troque o
-- e-mail) para se tornar administrador:
--
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
-- =====================================================================
