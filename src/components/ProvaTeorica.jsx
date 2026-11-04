import React, { useMemo, useState } from "react";
import { Loader2, Upload, Trash2, ChevronRight } from "lucide-react";
import { Metric } from "./ui";
import { codigoTurma } from "../lib/helpers";
import { interpretarPlanilha, lerPlanilha } from "../lib/planilhaObjetiva";

const inputCls = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

const corBarra = (p) => (p >= 70 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500");

function Linha({ turma, registro, resumoAlunos, aberto, onToggle, onSalvar }) {
  const [percentual, setPercentual] = useState(registro?.percentual ?? "");
  const [observacao, setObservacao] = useState(registro?.observacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const alterado =
    String(percentual) !== String(registro?.percentual ?? "") ||
    observacao !== (registro?.observacao ?? "");
  const valor = percentual === "" ? null : Number(percentual);
  const invalido = valor !== null && (Number.isNaN(valor) || valor < 0 || valor > 100);

  const salvar = async () => {
    setErro("");
    setSalvando(true);
    try {
      await onSalvar(turma.id, { percentual: valor, observacao: observacao.trim() || null });
    } catch (e) {
      setErro(e.message || "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2">
        <button type="button" onClick={onToggle} className="flex items-center gap-1.5 text-left" title="Ver alunos">
          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${aberto ? "rotate-90" : ""}`} />
          <span className="font-medium text-blue-700 hover:underline">{codigoTurma(turma.titulo)}</span>
        </button>
        <div className="ml-5 text-xs text-slate-400">{turma.data}</div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="100" step="0.01"
            className={`${inputCls} w-24`}
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
          />
          <span className="text-slate-500">%</span>
        </div>
        {valor !== null && !invalido && (
          <div className="mt-1.5 h-1.5 w-32 rounded bg-slate-100">
            <div className={`h-1.5 rounded ${corBarra(valor)}`} style={{ width: `${valor}%` }} />
          </div>
        )}
        {invalido && <p className="mt-1 text-xs text-rose-600">Informe de 0 a 100.</p>}
        {resumoAlunos && (
          <p className="mt-1 text-xs text-slate-500">
            Média dos alunos: <strong>{resumoAlunos.media.toFixed(1)}%</strong> ({resumoAlunos.total} alunos)
          </p>
        )}
      </td>
      <td className="px-3 py-2">
        <input className={`${inputCls} w-full`} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        {erro && <p className="mt-1 text-xs text-rose-600">{erro}</p>}
      </td>
      <td className="px-3 py-2">
        <button
          onClick={salvar}
          disabled={!alterado || invalido || salvando}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar
        </button>
      </td>
    </tr>
  );
}

export default function ProvaTeorica({ turmas, provas, alunos = [], onSalvar, onImportarAlunos, onExcluirAluno }) {
  const [abertaId, setAbertaId] = useState(null);
  const porEvento = useMemo(() => Object.fromEntries(provas.map((p) => [p.evento_id, p])), [provas]);
  const resumoPorEvento = useMemo(() => {
    const r = {};
    alunos.forEach((a) => {
      r[a.evento_id] = r[a.evento_id] || { soma: 0, total: 0 };
      r[a.evento_id].soma += Number(a.percentual);
      r[a.evento_id].total++;
    });
    Object.values(r).forEach((x) => { x.media = x.soma / x.total; });
    return r;
  }, [alunos]);
  const lista = useMemo(
    () => turmas.filter((t) => t && t.ativo !== false).sort((a, b) => String(a.titulo).localeCompare(String(b.titulo), "pt-BR")),
    [turmas]
  );
  const preenchidas = lista
    .map((t) => resumoPorEvento[t.id]?.media ?? porEvento[t.id]?.percentual)
    .filter((v) => v !== null && v !== undefined)
    .map(Number);
  const media = preenchidas.length ? preenchidas.reduce((a, b) => a + b, 0) / preenchidas.length : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Turmas no calendário" value={lista.length} />
        <Metric label="Com resultado" value={`${preenchidas.length}/${lista.length}`} tone="blue" />
        <Metric
          label="Média de acerto"
          value={media === null ? "—" : `${media.toFixed(1)}%`}
          tone={media === null ? "slate" : media >= 70 ? "emerald" : media >= 50 ? "amber" : "rose"}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {lista.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">Nenhuma turma registrada no calendário (cronograma).</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Turma (calendário)</th>
                <th className="px-3 py-2">% de acerto</th>
                <th className="px-3 py-2">Observação</th>
                <th className="w-24 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {lista.map((t) => {
                const alunosTurma = alunos.filter((a) => a.evento_id === t.id).sort((a, b) => a.aluno.localeCompare(b.aluno, "pt-BR"));
                const aberto = abertaId === t.id;
                return (
                  <React.Fragment key={t.id}>
                    <Linha
                      key={`${t.id}-${porEvento[t.id]?.updated_at || ""}`}
                      turma={t}
                      registro={porEvento[t.id]}
                      resumoAlunos={resumoPorEvento[t.id]}
                      aberto={aberto}
                      onToggle={() => setAbertaId(aberto ? null : t.id)}
                      onSalvar={onSalvar}
                    />
                    {aberto && (
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="px-6 py-3">
                          {alunosTurma.length === 0 ? (
                            <p className="text-sm text-slate-400">Nenhum aluno importado nesta turma.</p>
                          ) : (
                            <ul className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                              {alunosTurma.map((a) => (
                                <li key={a.id} className="flex items-center justify-between gap-3 border-b border-slate-200 py-1">
                                  <span className="text-slate-800">{a.aluno}</span>
                                  <span className="flex items-center gap-3">
                                    <span className="tabular-nums font-medium text-slate-700">{Number(a.percentual).toFixed(1)}%</span>
                                    <button
                                      title="Excluir"
                                      className="text-slate-400 hover:text-rose-600"
                                      onClick={() => window.confirm(`Excluir ${a.aluno}?`) && onExcluirAluno(a.id).catch((e) => window.alert(e.message))}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ImportarAlunos turmas={lista} onImportar={onImportarAlunos} />
    </div>
  );
}

function ImportarAlunos({ turmas, onImportar }) {
  const [previa, setPrevia] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [msg, setMsg] = useState("");
  const [turmaImport, setTurmaImport] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const escolher = async (file) => {
    if (!file) return;
    setErro(""); setMsg(""); setPrevia(null); setNomeArquivo(file.name);
    try {
      const resultado = interpretarPlanilha(await lerPlanilha(file), turmas, turmaImport);
      setPrevia(resultado);
    } catch (e) {
      setErro(e.message || "Não foi possível ler a planilha.");
    }
  };

  const confirmar = async () => {
    setOcupado(true); setErro("");
    try {
      await onImportar(previa.ok);
      setMsg(`${previa.ok.length} aluno(s) importado(s).`);
      setPrevia(null);
    } catch (e) {
      setErro(e.message || "Erro ao importar.");
    } finally {
      setOcupado(false);
    }
  };

  const porTurma = previa ? previa.ok.reduce((m, r) => ({ ...m, [r.turma]: (m[r.turma] || 0) + 1 }), {}) : {};

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Importar planilha de alunos</h3>
          <p className="text-xs text-slate-500">
            Arquivo .xlsx ou .csv com as colunas <strong>ALUNO</strong> e <strong>NOTA</strong> (a linha MÉDIA é ignorada).
            Escolha a turma ao lado; se a planilha tiver uma coluna <strong>Turma</strong>, ela é usada no lugar.
            Alunos já importados na mesma turma são atualizados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-md border border-slate-300 px-2.5 py-2 text-sm" value={turmaImport} onChange={(e) => setTurmaImport(e.target.value)}>
            <option value="">Turma da planilha…</option>
            {turmas.map((t) => <option key={t.id} value={t.id}>{codigoTurma(t.titulo)}</option>)}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Upload className="h-4 w-4" /> Escolher planilha
            <input type="file" accept=".xlsx,.csv,.txt" className="hidden" onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      {erro && <p className="text-sm text-rose-600">{erro}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      {previa && (
        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="font-medium text-slate-800">{nomeArquivo}</div>
          <div className="text-slate-700">
            {previa.ok.length} linha(s) reconhecida(s)
            {Object.keys(porTurma).length > 0 && <>: {Object.entries(porTurma).map(([t, n]) => `${t} (${n})`).join(", ")}</>}
          </div>
          {previa.erros.length > 0 && (
            <div className="text-rose-700">
              {previa.erros.length} linha(s) ignorada(s):
              <ul className="ml-4 list-disc">
                {previa.erros.slice(0, 10).map((e, i) => <li key={i}>Linha {e.linha}{e.aluno ? ` (${e.aluno})` : ""}: {e.erro}</li>)}
                {previa.erros.length > 10 && <li>… e mais {previa.erros.length - 10}</li>}
              </ul>
            </div>
          )}
          <button
            onClick={confirmar}
            disabled={ocupado || previa.ok.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {ocupado && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirmar importação
          </button>
        </div>
      )}
    </div>
  );
}
