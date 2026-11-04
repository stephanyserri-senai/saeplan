import React, { useMemo, useState } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Metric } from "./ui";
import { codigoTurma } from "../lib/helpers";
import { interpretarPlanilha, lerPlanilha } from "../lib/planilhaObjetiva";

const inputCls = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

const corBarra = (p) => (p >= 70 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500");

function Linha({ turma, registro, resumoAlunos, onSalvar }) {
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
        <div className="font-medium text-slate-800">{codigoTurma(turma.titulo)}</div>
        <div className="text-xs text-slate-400">{turma.data}</div>
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
              {lista.map((t) => (
                <Linha key={`${t.id}-${porEvento[t.id]?.updated_at || ""}`} turma={t} registro={porEvento[t.id]} resumoAlunos={resumoPorEvento[t.id]} onSalvar={onSalvar} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ImportarAlunos turmas={lista} alunos={alunos} onImportar={onImportarAlunos} onExcluir={onExcluirAluno} />
    </div>
  );
}

function ImportarAlunos({ turmas, alunos, onImportar, onExcluir }) {
  const [previa, setPrevia] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [turmaSel, setTurmaSel] = useState("");
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const comAlunos = useMemo(() => turmas.filter((t) => alunos.some((a) => a.evento_id === t.id)), [turmas, alunos]);
  const eventoAtual = comAlunos.find((t) => t.id === turmaSel)?.id || comAlunos[0]?.id;
  const linhas = useMemo(
    () => alunos.filter((a) => a.evento_id === eventoAtual).sort((a, b) => a.aluno.localeCompare(b.aluno, "pt-BR")),
    [alunos, eventoAtual]
  );

  const escolher = async (file) => {
    if (!file) return;
    setErro(""); setMsg(""); setPrevia(null); setNomeArquivo(file.name);
    try {
      const resultado = interpretarPlanilha(await lerPlanilha(file), turmas);
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
            Arquivo .xlsx ou .csv com as colunas <strong>Turma</strong>, <strong>Aluno</strong> e <strong>Percentual</strong> na primeira linha.
            A turma deve existir no calendário. Alunos já importados na mesma turma são atualizados.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Upload className="h-4 w-4" /> Escolher planilha
          <input type="file" accept=".xlsx,.csv,.txt" className="hidden" onChange={(e) => { escolher(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
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

      {comAlunos.length > 0 && (
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {comAlunos.map((t) => (
              <button
                key={t.id}
                onClick={() => setTurmaSel(t.id)}
                className={`rounded-full px-3 py-1 text-sm ${t.id === eventoAtual ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {codigoTurma(t.titulo)}
              </button>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">Aluno</th><th className="px-3 py-2">% de acerto</th><th className="w-10" /></tr>
            </thead>
            <tbody>
              {linhas.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-800">{a.aluno}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-14 tabular-nums">{Number(a.percentual).toFixed(1)}%</span>
                      <div className="h-1.5 w-28 rounded bg-slate-100"><div className={`h-1.5 rounded ${corBarra(Number(a.percentual))}`} style={{ width: `${a.percentual}%` }} /></div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <button title="Excluir" className="text-slate-400 hover:text-rose-600" onClick={() => window.confirm(`Excluir ${a.aluno}?`) && onExcluir(a.id).catch((e) => setErro(e.message))}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
