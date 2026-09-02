import React, { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

// Opcional: restrinja o cadastro a um domínio de e-mail (ex.: "senai.br").
// Deixe vazio para permitir qualquer e-mail.
const DOMINIO_PERMITIDO = "";

export default function Auth() {
  const [modo, setModo] = useState("login"); // "login" | "cadastro"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const limpar = () => { setErro(""); setMsg(""); };

  const enviar = async () => {
    limpar();
    if (!email.trim() || !senha) { setErro("Preencha e-mail e senha."); return; }
    if (modo === "cadastro") {
      if (!nome.trim()) { setErro("Informe seu nome."); return; }
      if (DOMINIO_PERMITIDO && !email.trim().toLowerCase().endsWith(`@${DOMINIO_PERMITIDO}`)) {
        setErro(`Use um e-mail @${DOMINIO_PERMITIDO}.`); return;
      }
    }
    setCarregando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome: nome.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg("Conta criada. Confira seu e-mail para confirmar o acesso.");
          setModo("login");
        }
      }
    } catch (e) {
      setErro(traduzErro(e.message));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">Plano de Ação — SAEP</div>
            <div className="text-sm text-slate-500">Acompanhamento das ações</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => { setModo("login"); limpar(); }}
              className={`rounded-md py-1.5 text-sm font-medium ${modo === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >Entrar</button>
            <button
              onClick={() => { setModo("cadastro"); limpar(); }}
              className={`rounded-md py-1.5 text-sm font-medium ${modo === "cadastro" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >Criar conta</button>
          </div>

          {modo === "cadastro" && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700">Nome</label>
              <input
                value={nome}
                onChange={(e) => { setNome(e.target.value); limpar(); }}
                placeholder="Ex.: Stephany Ramos"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          <label className="block text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); limpar(); }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <label className="mt-3 block text-sm font-medium text-slate-700">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); limpar(); }}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {erro && <div className="mt-3 text-sm text-rose-600">{erro}</div>}
          {msg && <div className="mt-3 text-sm text-emerald-600">{msg}</div>}

          <button
            onClick={enviar}
            disabled={carregando}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
            {modo === "login" ? "Entrar" : "Criar conta"}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Cada pessoa tem seu login. O administrador acompanha e gerencia todas as ações.
        </p>
      </div>
    </div>
  );
}

function traduzErro(m = "") {
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/user already registered/i.test(m)) return "Este e-mail já tem conta. Use \"Entrar\".";
  if (/password should be at least/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/email not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar.";
  return m || "Não foi possível concluir. Tente novamente.";
}
