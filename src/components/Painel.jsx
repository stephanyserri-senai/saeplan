import React, { useMemo, useState } from "react";
import { Download, UserPlus, Trash2 } from "lucide-react";
import { statusEfetivo, exportarCSV } from "../lib/helpers";
import { Metric } from "./ui";

const listarResponsaveis = (a) => {
  if (Array.isArray(a?.responsaveis) && a.responsaveis.length) return a.responsaveis.filter(Boolean);
  return a?.responsavel ? [a.responsavel] : [];
};

const SENHA_PADRAO_USUARIO = "Saep@2026";

export default function Painel({
  acoes,
  usuarios = [],
  cronogramaEventos = [],
  onAdicionarUsuario,
  onEditarUsuario,
  onExcluirUsuario,
  onSalvarCronogramaEvento,
  onExcluirCronogramaEvento,
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(SENHA_PADRAO_USUARIO);
  const [role, setRole] = useState("colaborador");
  const [novoEventoTitulo, setNovoEventoTitulo] = useState("");
  const [novoEventoData, setNovoEventoData] = useState("");
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNome, setEditandoNome] = useState("");
  const [editandoEmail, setEditandoEmail] = useState("");
  const [editandoRole, setEditandoRole] = useState("colaborador");

  const stats = useMemo(() => {
    const total = acoes.length;
    const cont = { "Não iniciada": 0, "Em andamento": 0, "Concluída": 0, "Atrasada": 0 };
    acoes.forEach((a) => { const s = statusEfetivo(a); cont[s] = (cont[s] || 0) + 1; });
    const perc = total ? Math.round((cont["Concluída"] / total) * 100) : 0;

    const porResp = {};
    acoes.forEach((a) => {
      const nomes = listarResponsaveis(a);
      if (!nomes.length) {
        const r = "Todos";
        porResp[r] = porResp[r] || { total: 0, concluidas: 0 };
        porResp[r].total++;
        if (statusEfetivo(a) === "Concluída") porResp[r].concluidas++;
        return;
      }

      nomes.forEach((nomeResponsavel) => {
        const r = nomeResponsavel || "Todos";
        porResp[r] = porResp[r] || { total: 0, concluidas: 0 };
        porResp[r].total++;
        if (statusEfetivo(a) === "Concluída") porResp[r].concluidas++;
      });
    });

    const resp = Object.entries(porResp)
      .map(([nomeResp, v]) => ({ nome: nomeResp, ...v, perc: v.total ? Math.round((v.concluidas / v.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);

    return { total, cont, perc, resp };
  }, [acoes]);

  const barra = (n, cor) => {
    const w = stats.total ? Math.round((n / stats.total) * 100) : 0;
    return (
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${w}%` }} />
      </div>
    );
  };

  const handleAddUser = async () => {
    if (!nome.trim() || !email.trim()) {
      setErro("Preencha nome e e-mail.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      setMsg("");
      const senhaParaCriar = senha && senha.trim() ? senha.trim() : SENHA_PADRAO_USUARIO;
      await onAdicionarUsuario({ nome: nome.trim(), email: email.trim(), senha: senhaParaCriar, role });
      setNome("");
      setEmail("");
      setSenha(SENHA_PADRAO_USUARIO);
      setRole("colaborador");
      setMsg(`Usuário criado com sucesso. Senha inicial: ${SENHA_PADRAO_USUARIO}`);
    } catch (e) {
      setErro(e.message || "Não foi possível criar o usuário.");
    } finally {
      setCarregando(false);
    }
  };

  const abrirEdicao = (usuario) => {
    setEditandoId(usuario.id);
    setEditandoNome(usuario.nome || usuario.email || "");
    setEditandoEmail(usuario.email || "");
    setEditandoRole(usuario.role || "colaborador");
  };

  const salvarEdicaoUsuario = async () => {
    if (!editandoId || !editandoNome.trim()) {
      setErro("Informe o nome do usuário para salvar a edição.");
      return;
    }

    try {
      setCarregando(true);
      setErro("");
      setMsg("");
      await onEditarUsuario(editandoId, { nome: editandoNome.trim(), email: editandoEmail.trim(), role: editandoRole });
      setEditandoId(null);
      setEditandoNome("");
      setEditandoEmail("");
      setEditandoRole("colaborador");
      setMsg("Dados do usuário atualizados com sucesso.");
    } catch (e) {
      setErro(e.message || "Não foi possível atualizar o usuário.");
    } finally {
      setCarregando(false);
    }
  };

  const salvarEventoCronograma = async () => {
    if (!onSalvarCronogramaEvento) return;
    try {
      setCarregando(true);
      setErro("");
      setMsg("");
      await onSalvarCronogramaEvento({ titulo: novoEventoTitulo, data: novoEventoData });
      setNovoEventoTitulo("");
      setNovoEventoData("");
      setMsg("Data fixa do cronograma salva com sucesso.");
    } catch (e) {
      setErro(e.message || "Não foi possível salvar a data fixa.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Visão geral</h2>
        <button
          onClick={() => exportarCSV(acoes)}
          disabled={!acoes.length}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total de ações" value={stats.total} tone="blue" />
        <Metric label="Concluídas" value={stats.cont["Concluída"]} tone="emerald" />
        <Metric label="Em andamento" value={stats.cont["Em andamento"]} tone="amber" />
        <Metric label="Não iniciadas" value={stats.cont["Não iniciada"]} />
        <Metric label="Atrasadas" value={stats.cont["Atrasada"]} tone="rose" />
        <Metric label="Conclusão" value={`${stats.perc}%`} tone="blue" hint="do plano concluído" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Distribuição por status</h3>
          <div className="mt-4 space-y-3">
            {[
              ["Concluída", "bg-emerald-500"],
              ["Em andamento", "bg-amber-500"],
              ["Não iniciada", "bg-slate-400"],
              ["Atrasada", "bg-rose-500"],
            ].map(([nome, cor]) => (
              <div key={nome}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{nome}</span>
                  <span className="font-medium tabular-nums text-slate-800">{stats.cont[nome]}</span>
                </div>
                {barra(stats.cont[nome], cor)}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Progresso por responsável</h3>
          <div className="mt-4 space-y-3">
            {stats.resp.length === 0 && <p className="text-sm text-slate-400">Sem ações cadastradas ainda.</p>}
            {stats.resp.map((r) => (
              <div key={r.nome}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{r.nome}</span>
                  <span className="font-medium tabular-nums text-slate-800">{r.concluidas}/{r.total} · {r.perc}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${r.perc}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Adicionar usuário</h3>
          <UserPlus className="h-4 w-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Perfil</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="colaborador">Colaborador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>

        {erro && <div className="mt-3 text-sm text-rose-600">{erro}</div>}
        {msg && <div className="mt-3 text-sm text-emerald-600">{msg}</div>}

        <button onClick={handleAddUser} disabled={carregando} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
          {carregando ? "Criando..." : "Adicionar usuário"}
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Datas fixas do cronograma</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Título</label>
            <input
              value={novoEventoTitulo}
              onChange={(e) => setNovoEventoTitulo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Ex.: Prova objetiva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Data</label>
            <input
              type="date"
              value={novoEventoData}
              onChange={(e) => setNovoEventoData(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={salvarEventoCronograma}
            disabled={carregando || !novoEventoTitulo.trim() || !novoEventoData}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Salvar data fixa
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {cronogramaEventos.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma data fixa cadastrada.</p>
          ) : (
            cronogramaEventos.filter((evento) => evento && evento.ativo !== false).map((evento) => (
              <div key={evento.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-800">{evento.titulo}</div>
                  <div className="text-xs text-slate-500">{evento.data}</div>
                </div>
                {onExcluirCronogramaEvento && (
                  <button
                    onClick={() => onExcluirCronogramaEvento(evento.id)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Excluir data fixa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Usuários cadastrados</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {usuarios.length === 0 && <p className="text-sm text-slate-400">Nenhum usuário cadastrado.</p>}
          {usuarios.map((usuario) => {
            const editando = editandoId === usuario.id;
            return (
              <div key={usuario.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {editando ? (
                  <div className="space-y-2">
                    <input
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      type="email"
                      value={editandoEmail}
                      onChange={(e) => setEditandoEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <select
                      value={editandoRole}
                      onChange={(e) => setEditandoRole(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="colaborador">Colaborador</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditandoId(null); setEditandoEmail(""); }} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600">Cancelar</button>
                      <button onClick={salvarEdicaoUsuario} className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-800">{usuario.nome || usuario.email}</div>
                      <div className="text-slate-500">{usuario.email || "Sem e-mail"}</div>
                      <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{usuario.role}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEdicao(usuario)}
                        title="Editar usuário"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" /></svg>
                      </button>
                      {onExcluirUsuario && (
                        <button
                          onClick={() => onExcluirUsuario(usuario)}
                          title="Excluir usuário"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
