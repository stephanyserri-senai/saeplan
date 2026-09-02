import React, { useMemo } from "react";
import { Download } from "lucide-react";
import { statusEfetivo, exportarCSV } from "../lib/helpers";
import { Metric } from "./ui";

export default function Painel({ acoes }) {
  const stats = useMemo(() => {
    const total = acoes.length;
    const cont = { "Não iniciada": 0, "Em andamento": 0, "Concluída": 0, "Atrasada": 0 };
    acoes.forEach((a) => { const s = statusEfetivo(a); cont[s] = (cont[s] || 0) + 1; });
    const perc = total ? Math.round((cont["Concluída"] / total) * 100) : 0;

    const porResp = {};
    acoes.forEach((a) => {
      const r = a.responsavel || "—";
      porResp[r] = porResp[r] || { total: 0, concluidas: 0 };
      porResp[r].total++;
      if (statusEfetivo(a) === "Concluída") porResp[r].concluidas++;
    });
    const resp = Object.entries(porResp)
      .map(([nome, v]) => ({ nome, ...v, perc: v.total ? Math.round((v.concluidas / v.total) * 100) : 0 }))
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
    </div>
  );
}
