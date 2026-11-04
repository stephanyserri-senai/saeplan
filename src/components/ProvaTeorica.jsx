import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Metric } from "./ui";
import { codigoTurma } from "../lib/helpers";

const inputCls = "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

const corBarra = (p) => (p >= 70 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500");

function Linha({ turma, registro, onSalvar }) {
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

export default function ProvaTeorica({ turmas, provas, onSalvar }) {
  const porEvento = useMemo(() => Object.fromEntries(provas.map((p) => [p.evento_id, p])), [provas]);
  const lista = useMemo(
    () => turmas.filter((t) => t && t.ativo !== false).sort((a, b) => String(a.titulo).localeCompare(String(b.titulo), "pt-BR")),
    [turmas]
  );
  const preenchidas = lista.map((t) => porEvento[t.id]?.percentual).filter((v) => v !== null && v !== undefined).map(Number);
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
                <Linha key={`${t.id}-${porEvento[t.id]?.updated_at || ""}`} turma={t} registro={porEvento[t.id]} onSalvar={onSalvar} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
