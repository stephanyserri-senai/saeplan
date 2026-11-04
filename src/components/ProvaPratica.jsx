import React, { useMemo, useState } from "react";
import { Plus, Trash2, Paperclip, Loader2, ExternalLink, Users } from "lucide-react";
import { uploadEvidenciaArquivo } from "../lib/storage";
import { codigoTurma } from "../lib/helpers";

const inputCls = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

export default function ProvaPratica({ turmasCalendario = [], provas, userId, isAdmin, onAdicionar, onAtualizar, onExcluir }) {
  const [turmaSel, setTurmaSel] = useState("");
  const [aluno, setAluno] = useState("");
  const [data, setData] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [enviandoId, setEnviandoId] = useState(null);
  const [erro, setErro] = useState("");

  const turmas = useMemo(
    () => [...new Set(turmasCalendario.filter((e) => e && e.ativo !== false).map((e) => codigoTurma(e.titulo)))]
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [turmasCalendario]
  );
  const turmaAtual = turmas.includes(turmaSel) ? turmaSel : turmas[0] || "";
  const linhas = useMemo(
    () => provas
      .filter((p) => codigoTurma(p.turma) === turmaAtual)
      .sort((a, b) => a.aluno.localeCompare(b.aluno, "pt-BR")),
    [provas, turmaAtual]
  );
  const aplicadas = linhas.filter((p) => p.data_aplicacao).length;
  const podeEditar = (p) => isAdmin || p.criado_por === userId;

  const executar = async (fn) => {
    setErro("");
    try { await fn(); } catch (e) { setErro(e.message || "Erro ao salvar."); }
  };

  const adicionar = (e) => {
    e.preventDefault();
    const turma = turmaAtual;
    if (!turma || !aluno.trim()) return;
    executar(async () => {
      setSalvando(true);
      try {
        await onAdicionar({ turma, aluno: aluno.trim(), data_aplicacao: data || null });
        setAluno("");
        setData("");
      } finally { setSalvando(false); }
    });
  };

  const anexar = (p, file) => {
    if (!file) return;
    executar(async () => {
      setEnviandoId(p.id);
      try {
        const url = await uploadEvidenciaArquivo(file, "provas-praticas");
        await onAtualizar(p.id, { evidencia_url: url, evidencia_nome: file.name });
      } finally { setEnviandoId(null); }
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Registrar aluno{turmaAtual ? ` — ${turmaAtual}` : ""}</h2>
        <form onSubmit={adicionar} className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-500">Aluno
            <input className={`${inputCls} mt-1 block w-64`} value={aluno} onChange={(e) => setAluno(e.target.value)} />
          </label>
          <label className="text-xs text-slate-500">Data de aplicação
            <input type="date" className={`${inputCls} mt-1 block`} value={data} onChange={(e) => setData(e.target.value)} />
          </label>
          <button
            type="submit"
            disabled={salvando || !aluno.trim() || !turmaAtual}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
          </button>
        </form>
        {erro && <p className="mt-2 text-sm text-rose-600">{erro}</p>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <Users className="h-4 w-4 text-slate-400" />
          {turmas.length === 0 && <span className="text-sm text-slate-400">Nenhuma turma registrada no calendário.</span>}
          {turmas.map((t) => (
            <button
              key={t}
              onClick={() => setTurmaSel(t)}
              className={`rounded-full px-3 py-1 text-sm ${t === turmaAtual ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {t}
            </button>
          ))}
          {turmaAtual && (
            <span className="ml-auto text-sm text-slate-500">{aplicadas}/{linhas.length} com data de aplicação</span>
          )}
        </div>

        {turmaAtual && linhas.length === 0 && (
          <p className="p-4 text-sm text-slate-400">Nenhum aluno registrado em {turmaAtual}. Use o formulário acima para adicionar.</p>
        )}
        {linhas.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Aluno</th>
                <th className="px-3 py-2">Data de aplicação</th>
                <th className="px-3 py-2">Evidência</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {linhas.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{p.aluno}</td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      className={inputCls}
                      disabled={!podeEditar(p)}
                      value={p.data_aplicacao || ""}
                      onChange={(e) => executar(() => onAtualizar(p.id, { data_aplicacao: e.target.value || null }))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {p.evidencia_url && (
                        <a href={p.evidencia_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" /> {p.evidencia_nome || "Ver evidência"}
                        </a>
                      )}
                      {podeEditar(p) && (
                        <label className="inline-flex cursor-pointer items-center gap-1 text-slate-500 hover:text-slate-800">
                          {enviandoId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                          {p.evidencia_url ? "Trocar" : "Anexar"}
                          <input type="file" className="hidden" onChange={(e) => { anexar(p, e.target.files?.[0]); e.target.value = ""; }} />
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {podeEditar(p) && (
                      <button
                        title="Excluir"
                        className="text-slate-400 hover:text-rose-600"
                        onClick={() => window.confirm(`Excluir ${p.aluno}?`) && executar(() => onExcluir(p.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
