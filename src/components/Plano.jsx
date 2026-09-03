import React, { useState, useMemo } from "react";
import {
  ClipboardList, Plus, Search, Pencil, Trash2, ExternalLink,
} from "lucide-react";
import { STATUS, estaAtrasada, statusEfetivo, fmtData, ehLink } from "../lib/helpers";
import { StatusBadge } from "./ui";

const listarResponsaveis = (a) => {
  if (Array.isArray(a?.responsaveis) && a.responsaveis.length) return a.responsaveis.filter(Boolean);
  if (a?.responsavel) return [a.responsavel];
  return [];
};

export default function Plano({ acoes, userId, isAdmin, meNome, onNova, onEditar, onExcluir }) {
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState("todos");
  const [fResp, setFResp] = useState("todos");

  const responsaveis = useMemo(
    () => Array.from(new Set(acoes.flatMap((a) => listarResponsaveis(a)))).sort(),
    [acoes]
  );

  const filtradas = useMemo(() => {
    return acoes.filter((a) => {
      if (fStatus !== "todos" && statusEfetivo(a) !== fStatus) return false;
      const nomes = listarResponsaveis(a);
      if (fResp !== "todos" && !nomes.includes(fResp)) return false;
      if (busca) {
        const q = busca.toLowerCase();
        const alvo = `${a.titulo} ${a.descricao} ${nomes.join(" ")} ${a.area} ${a.evidencia}`.toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }, [acoes, busca, fStatus, fResp]);

  const podeEditar = (a) => isAdmin || a.owner === userId;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar ação, responsável..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500">
            <option value="todos">Todos os status</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fResp} onChange={(e) => setFResp(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500">
            <option value="todos">Todos os responsáveis</option>
            {responsaveis.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={onNova}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nova ação
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Prazo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Evidência</th>
                <th className="px-4 py-3 text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map((a) => {
                const atrasada = estaAtrasada(a);
                const responsaveisTexto = listarResponsaveis(a).length ? listarResponsaveis(a).join(", ") : "—";
                return (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 align-top">
                      {a.titulo && <div className="font-medium text-slate-900">{a.titulo}</div>}
                      <div className="max-w-md text-slate-600">{a.descricao}</div>
                      {a.area && <div className="mt-0.5 text-xs text-slate-400">{a.area}</div>}
                    </td>
                    <td className="px-4 py-3 align-top text-slate-700">{responsaveisTexto}</td>
                    <td className="px-4 py-3 align-top">
                      <span className={atrasada ? "font-medium text-rose-600" : "text-slate-600"}>{fmtData(a.prazo)}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={statusEfetivo(a)} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      {a.evidencia ? (() => {
                        const evidencia = String(a.evidencia);
                        const isImage = evidencia.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(evidencia);

                        if (isImage) {
                          return (
                            <a href={evidencia} target="_blank" rel="noreferrer" className="inline-flex max-w-[110px] overflow-hidden rounded border border-slate-200 bg-slate-50 p-1">
                              <img src={evidencia} alt="Evidência" className="h-12 w-full object-cover" />
                            </a>
                          );
                        }

                        if (ehLink(evidencia)) {
                          return (
                            <a href={evidencia} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              <ExternalLink className="h-3.5 w-3.5" /> Abrir
                            </a>
                          );
                        }

                        return <span className="text-slate-500">{evidencia}</span>;
                      })() : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end gap-1">
                        {podeEditar(a) ? (
                          <>
                            <button onClick={() => onEditar(a)} title="Editar"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => onExcluir(a)} title="Excluir"
                              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtradas.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <ClipboardList className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              {acoes.length === 0 ? "Nenhuma ação registrada ainda" : "Nada encontrado com esses filtros"}
            </p>
            <p className="text-sm text-slate-400">
              {acoes.length === 0 ? "Comece adicionando a primeira ação do plano." : "Ajuste a busca ou os filtros acima."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
