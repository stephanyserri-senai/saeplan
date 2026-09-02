# Plano de Ação — SAEP

Aplicação web para registrar e acompanhar as ações do plano do SAEP. Cada pessoa
tem login próprio, registra suas ações (descrição, responsável, prazo, status e
evidência) e o administrador acompanha tudo em um painel, com exportação em CSV.

Stack: React + Vite (front-end) e Supabase (login e banco de dados). Deploy na Vercel.

---

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie um projeto (plano gratuito serve).
2. No menu **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
   Isso cria as tabelas, os gatilhos e as regras de segurança.
3. Em **Project Settings → API**, copie dois valores:
   - **Project URL**
   - **anon public** (a chave pública)

Opcional, mas recomendado para uso interno rápido: em **Authentication → Providers → Email**,
desligue **Confirm email**. Assim as pessoas entram direto após o cadastro, sem precisar
confirmar o e-mail.

## 2. Configurar as variáveis

Crie um arquivo `.env` na raiz (baseie-se no `.env.example`):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-public
```

## 3. Rodar localmente (opcional)

```
npm install
npm run dev
```

Abra o endereço que aparecer (geralmente http://localhost:5173).

## 4. Publicar na Vercel

**Pelo site (mais simples):**
1. Suba a pasta para um repositório no GitHub.
2. Em https://vercel.com, clique em **Add New → Project** e importe o repositório.
3. A Vercel detecta o Vite sozinho (build: `npm run build`, saída: `dist`).
4. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   com os mesmos valores do `.env`.
5. Clique em **Deploy**. Ao final, você recebe o link para compartilhar com a equipe.

**Pela linha de comando (alternativa):**
```
npm i -g vercel
vercel
```
Depois configure as duas variáveis de ambiente pelo painel da Vercel e rode `vercel --prod`.

## 5. Virar administrador

1. Crie sua conta normalmente pelo app (aba **Criar conta**).
2. No **SQL Editor** do Supabase, rode (troque o e-mail):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');
```

3. Saia e entre de novo no app: a aba **Painel** aparece para você.

---

## Como funciona o acesso

- **Colaborador**: vê todas as ações do plano, cria ações e edita/exclui apenas as suas.
- **Administrador**: edita e exclui qualquer ação e acessa o **Painel** (métricas + CSV).

As regras são aplicadas no banco (Row Level Security), não só na tela — ou seja, ninguém
altera a ação de outra pessoa mesmo mexendo no código do navegador.

## Ajustes rápidos

- **Restringir cadastro a um domínio** (ex.: só `@senai.br`): em `src/components/Auth.jsx`,
  defina `DOMINIO_PERMITIDO = "senai.br"`. Para bloquear cadastros abertos por completo,
  desligue os cadastros em **Authentication → Providers** no Supabase e crie os usuários
  manualmente.
- **Evidências**: o app guarda um link ou observação, não o arquivo em si. Suba o arquivo
  no Google Drive (ou similar) e cole o link no campo de evidência.
