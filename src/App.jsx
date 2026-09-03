import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardList, LayoutDashboard, LogOut, ShieldCheck, User, Loader2,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import { TabButton } from "./components/ui";
import Auth from "./components/Auth";
import Plano from "./components/Plano";
import Painel from "./components/Painel";
import ActionForm from "./components/ActionForm";

const SENHA_PADRAO_USUARIO = "Saep@2026";

export default function App() {
  const [session, setSession] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [profile, setProfile] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [acoes, setAcoes] = useState([]);
  const [carregandoAcoes, setCarregandoAcoes] = useState(true);
  const [aba, setAba] = useState("plano");
  const [modal, setModal] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [erroTrocaSenha, setErroTrocaSenha] = useState("");
  const [msgTrocaSenha, setMsgTrocaSenha] = useState("");
  const [carregandoTrocaSenha, setCarregandoTrocaSenha] = useState(false);

  const isAdmin = profile?.role === "admin";
  const user = session?.user;
  const meNome = profile?.nome || user?.email || "";
  const precisaTrocarSenha = Boolean(user?.user_metadata?.must_change_password || profile?.must_change_password);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregandoAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setUsuarios([]);
      return;
    }

    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setProfile(data || { id: user.id, nome: user.email, role: "colaborador" }));

    if (isAdmin) {
      supabase.from("profiles").select("*").order("nome", { ascending: true })
        .then(({ data }) => setUsuarios(data || []));
    }
  }, [user, isAdmin]);

  const carregarAcoes = useCallback(async () => {
    const { data, error } = await supabase
      .from("acoes").select("*").order("created_at", { ascending: false });
    if (!error) setAcoes(data || []);
    setCarregandoAcoes(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    carregarAcoes();
    const canal = supabase
      .channel("acoes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "acoes" }, carregarAcoes)
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [user, carregarAcoes]);

  const carregarUsuarios = useCallback(async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("nome", { ascending: true });
    if (!error) setUsuarios(data || []);
  }, []);

  const normalizarNome = (valor) => (valor || "").trim().toLowerCase();

  const adicionarUsuario = async ({ nome, email, senha, role }) => {
    const senhaPadrao = senha || SENHA_PADRAO_USUARIO;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senhaPadrao,
      options: {
        data: {
          nome: nome.trim(),
          must_change_password: true,
        },
      },
    });

    if (error) {
      const mensagem = error.message || "";
      if (/rate limit exceeded|email rate limit/i.test(mensagem)) {
        throw new Error("Limite de e-mails do Supabase atingido. Aguarde alguns minutos e tente novamente, ou crie os usuários via painel administrativo com fluxo backend/Edge Function do Supabase.");
      }
      throw new Error(mensagem);
    }

    if (data?.user) {
      const { error: errorPerfil } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id, nome: nome.trim(), role: role || "colaborador", must_change_password: true }, { onConflict: "id" });

      if (errorPerfil) throw new Error(errorPerfil.message);
    }

    await carregarUsuarios();
  };

  const atualizarUsuario = async (usuarioId, dados) => {
    if (!usuarioId) return;

    const nome = (dados.nome || "").trim();
    const email = (dados.email || "").trim();
    const role = dados.role || "colaborador";

    const { error: errorPerfil } = await supabase
      .from("profiles")
      .update({ nome: nome || null, role, must_change_password: false })
      .eq("id", usuarioId);

    if (errorPerfil) throw new Error(errorPerfil.message);

    if (user?.id === usuarioId && nome) {
      await supabase.auth.updateUser({ data: { nome } });
    }

    if (email) {
      try {
        if (typeof supabase.auth.admin?.updateUserById === "function" && user?.id !== usuarioId) {
          const { error: updateEmailError } = await supabase.auth.admin.updateUserById(usuarioId, { email });
          if (updateEmailError) throw updateEmailError;
        } else if (user?.id === usuarioId) {
          const { error: selfUpdateError } = await supabase.auth.updateUser({ email });
          if (selfUpdateError) throw selfUpdateError;
        }
      } catch (e) {
        throw new Error(e.message || "Não foi possível atualizar o e-mail do usuário.");
      }
    }

    await carregarUsuarios();
  };

  const excluirUsuario = async (usuario) => {
    if (!usuario?.id) return;
    if (usuario.id === user.id) {
      window.alert("Você não pode excluir o seu próprio usuário.");
      return;
    }

    const confirmar = window.confirm(`Excluir o usuário "${usuario.nome || usuario.email}"?`);
    if (!confirmar) return;

    const { error } = await supabase.auth.admin.deleteUser(usuario.id);
    if (error) {
      window.alert("Não foi possível excluir o usuário: " + error.message);
      return;
    }

    await carregarUsuarios();
  };

  const acoesVisiveis = useMemo(() => {
    if (isAdmin) return acoes;
    if (!user) return [];

    return acoes.filter((a) => {
      const responsaveis = Array.isArray(a.responsaveis) && a.responsaveis.length
        ? a.responsaveis
        : a.responsavel
          ? [a.responsavel]
          : [];

      const nomeAtual = normalizarNome(meNome);
      const visivel = responsaveis.some((r) => {
        const valor = normalizarNome(r);
        return valor === "todos" || valor === nomeAtual;
      }) || responsaveis.length === 0 || a.owner === user.id;

      return visivel;
    });
  }, [acoes, isAdmin, meNome, user]);

  const salvar = async (f) => {
    const responsaveis = Array.isArray(f.responsaveis)
      ? f.responsaveis.map((r) => r.trim()).filter(Boolean)
      : [];

    const payload = {
      titulo: f.titulo?.trim() || null,
      descricao: f.descricao.trim(),
      responsavel: responsaveis.includes("Todos") ? "Todos" : (responsaveis[0] || f.responsavel?.trim() || meNome || "Todos"),
      responsaveis: responsaveis.length ? responsaveis : [f.responsavel?.trim() || meNome || "Todos"],
      area: f.area?.trim() || null,
      prazo: f.prazo || null,
      status: f.status,
      evidencia: f.evidencia?.trim() || null,
    };

    if (f.id) {
      const { error } = await supabase.from("acoes").update(payload).eq("id", f.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("acoes").insert({ ...payload, owner: user.id });
      if (error) throw new Error(error.message);
    }

    await carregarAcoes();
    setModal(null);
  };

  const excluir = async (a) => {
    if (!window.confirm(`Excluir a ação "${a.titulo || a.descricao.slice(0, 40)}"?`)) return;
    const { error } = await supabase.from("acoes").delete().eq("id", a.id);
    if (error) { window.alert("Não foi possível excluir: " + error.message); return; }
    await carregarAcoes();
  };

  const sair = async () => { await supabase.auth.signOut(); setAba("plano"); };

  const alterarSenhaPrimeiroAcesso = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      setErroTrocaSenha("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      setErroTrocaSenha("As senhas não coincidem.");
      return;
    }

    try {
      setCarregandoTrocaSenha(true);
      setErroTrocaSenha("");
      setMsgTrocaSenha("");

      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      const { error: perfilError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id);

      if (perfilError) throw perfilError;

      setNovaSenha("");
      setConfirmacaoSenha("");
      setMsgTrocaSenha("Senha alterada com sucesso.");
      setTimeout(() => {
        setMsgTrocaSenha("");
        setProfile((atual) => ({ ...atual, must_change_password: false }));
      }, 1200);
    } catch (e) {
      setErroTrocaSenha(e.message || "Não foi possível alterar a senha.");
    } finally {
      setCarregandoTrocaSenha(false);
    }
  };

  if (carregandoAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session) return <Auth />;

  if (precisaTrocarSenha) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Primeiro acesso</h2>
            <p className="mt-1 text-sm text-slate-500">Defina uma nova senha para continuar.</p>
          </div>

          <label className="block text-sm font-medium text-slate-700">Nova senha</label>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <label className="mt-3 block text-sm font-medium text-slate-700">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmacaoSenha}
            onChange={(e) => setConfirmacaoSenha(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {erroTrocaSenha && <div className="mt-3 text-sm text-rose-600">{erroTrocaSenha}</div>}
          {msgTrocaSenha && <div className="mt-3 text-sm text-emerald-600">{msgTrocaSenha}</div>}

          <button
            onClick={alterarSenhaPrimeiroAcesso}
            disabled={carregandoTrocaSenha}
            className="mt-5 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {carregandoTrocaSenha ? "Salvando..." : "Salvar nova senha"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Plano de Ação — SAEP</div>
              <div className="text-xs text-slate-400">Acompanhamento das ações</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-slate-300">{meNome}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isAdmin ? "bg-blue-500/20 text-blue-200" : "bg-white/10 text-slate-200"}`}>
                {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {isAdmin ? "Administrador" : "Colaborador"}
              </span>
            </div>
            <button onClick={sair} title="Sair"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <nav className="flex gap-1">
            <TabButton active={aba === "plano"} onClick={() => setAba("plano")} icon={ClipboardList}>Plano de ação</TabButton>
            {isAdmin && (
              <TabButton active={aba === "painel"} onClick={() => setAba("painel")} icon={LayoutDashboard}>Painel</TabButton>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {carregandoAcoes ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : aba === "painel" && isAdmin ? (
          <Painel
            acoes={acoes}
            usuarios={usuarios}
            onAdicionarUsuario={adicionarUsuario}
            onEditarUsuario={atualizarUsuario}
            onExcluirUsuario={excluirUsuario}
          />
        ) : (
          <Plano
            acoes={acoesVisiveis}
            userId={user.id}
            isAdmin={isAdmin}
            meNome={meNome}
            onNova={() => setModal({ inicial: null })}
            onEditar={(a) => setModal({ inicial: a })}
            onExcluir={excluir}
          />
        )}
      </main>

      {modal && (
        <ActionForm
          inicial={modal.inicial}
          meNome={meNome}
          usuarios={usuarios}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  );
}
