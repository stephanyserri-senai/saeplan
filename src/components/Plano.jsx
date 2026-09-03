import React, { useState, useMemo } from "react";
import {
  Bell, CalendarDays, ClipboardList, Plus, Search, Pencil, Trash2, ExternalLink, X,
} from "lucide-react";
import { STATUS, estaAtrasada, statusEfetivo, fmtData, ehLink } from "../lib/helpers";
import { StatusBadge } from "./ui";

const diferencaDias = (valor) => {
  if (!valor) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000);
};

const listarResponsaveis = (a) => {
  if (Array.isArray(a?.responsaveis) && a.responsaveis.length) return a.responsaveis.filter(Boolean);
  if (a?.responsavel) return [a.responsavel];
  return [];
};

const formatarData = (valor) => {
  if (!valor) return "—";
  const data = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(data);
};

export default function Plano({ acoes, notificacoes = [], cronogramaEventos = [], userId, isAdmin, meNome, onNova, onEditar, onExcluir, onMarcarNotificacoes }) {
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState("todos");
  const [fResp, setFResp] = useState("todos");
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const mostrarCronograma = true;

  const onMarcarComoLidas = async () => {
    if (!onMarcarNotificacoes || !idsPendentes.length) return;
    await onMarcarNotificacoes(idsPendentes);
    setMostrarNotificacoes(false);
  };

  const abrirNotificacoes = () => setMostrarNotificacoes(true);

  const responsaveis = useMemo(
    () => Array.from(new Set(acoes.flatMap((a) => listarResponsaveis(a)))).sort(),
    [acoes]
  );

  const notificacoesVisiveis = useMemo(() => {
    if (Array.isArray(notificacoes) && notificacoes.length) {
      return notificacoes
        .filter((item) => item && item.status !== "visualizado" && item.status !== "cancelado")
        .map((item) => ({
          id: item.id,
          usuario: item.usuario_id || "Usuário",
          titulo: item.titulo || "Ação",
          data: item.data_prazo || item.prazo,
          diasRestantes: item.dias_restantes ?? diferencaDias(item.data_prazo || item.prazo),
          status: item.status || "pendente",
        }))
        .sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    return acoes
      .filter((a) => a.prazo && statusEfetivo(a) !== "Concluída")
      .flatMap((a) => {
        const nomes = listarResponsaveis(a);
        const destinatarios = isAdmin
          ? nomes.filter(Boolean)
          : nomes.includes("Todos") || nomes.includes(meNome)
            ? [meNome].filter(Boolean)
            : [];

        return destinatarios.map((destinatario) => ({
          id: `${a.id}-${destinatario}`,
          usuario: destinatario,
          titulo: a.titulo || a.descricao || "Ação",
          data: a.prazo,
          diasRestantes: diferencaDias(a.prazo),
          status: statusEfetivo(a),
        }));
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [acoes, isAdmin, meNome, notificacoes]);

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

  const cronogramaCompleto = useMemo(() => {
    const eventosFixos = Array.isArray(cronogramaEventos)
      ? cronogramaEventos.map((evento) => ({ ...evento, tipo: "Fixa" }))
      : [];

    const eventosDePrazo = notificacoesVisiveis.map((item) => ({
      titulo: item.titulo,
      data: item.data,
      tipo: item.usuario,
      usuario: item.usuario,
    }));

    return [...eventosFixos, ...eventosDePrazo].sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [cronogramaEventos, notificacoesVisiveis]);

  const podeEditar = (a) => isAdmin || a.owner === userId;
  const idsPendentes = notificacoesVisiveis.map((item) => item.id).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="fixed left-4 top-[118px] z-40 w-[min(20rem,calc(100vw-2rem))] space-y-3">
        {mostrarNotificacoes && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-3 shadow-lg shadow-amber-100/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Bell className="h-4 w-4" />
                {notificacoesVisiveis.length > 0 ? `${notificacoesVisiveis.length} notificações pendentes` : "Sem notificações pendentes"}
              </div>
              <div className="flex items-center gap-2">
                {idsPendentes.length > 0 && onMarcarNotificacoes && (
                  <button
                    onClick={onMarcarComoLidas}
                    className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                  >
                    Marcar como lidas
                  </button>
                )}
                <button
                  onClick={() => setMostrarNotificacoes(false)}
                  className="rounded-md p-1 text-amber-700 hover:bg-amber-100"
                  aria-label="Fechar notificações"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {notificacoesVisiveis.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {notificacoesVisiveis.slice(0, 3).map((item) => {
                  const estado = item.diasRestantes === 0 ? "vence hoje" : item.diasRestantes < 0 ? `vencida há ${Math.abs(item.diasRestantes)} dia${Math.abs(item.diasRestantes) === 1 ? "" : "s"}` : `vence em ${item.diasRestantes} dia${item.diasRestantes === 1 ? "" : "s"}`;
                  return (
                    <li key={item.id} className="flex flex-wrap items-center gap-2 leading-relaxed">
                      <span className="font-medium text-amber-900">{item.titulo}</span>
                      <span className="text-amber-700">•</span>
                      <span>{estado}</span>
                      <span className="text-amber-700">•</span>
                      <span>{formatarData(item.data)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            Cronograma
          </div>

          <div className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto text-sm text-slate-700">
            {cronogramaCompleto.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                Nenhuma data fixa ou prazo disponível.
              </div>
            ) : (
              cronogramaCompleto.map((evento, index) => (
                <div key={`${evento.titulo}-${evento.data}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800">{evento.titulo}</div>
                    {!evento.tipo || evento.tipo === "Fixa" ? null : <div className="text-[11px] text-slate-500">Responsável: {evento.usuario}</div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-medium text-slate-700">{formatarData(evento.data)}</div>
                    <div className={`text-[11px] ${evento.tipo === "Fixa" ? "text-blue-600" : "text-amber-600"}`}>
                      {evento.tipo === "Fixa" ? "Data fixa" : "Prazo da ação"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ paddingLeft: mostrarCronograma ? '20rem' : '0', transition: 'padding-left 0.2s ease' }}>
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
