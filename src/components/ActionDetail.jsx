import React, { useMemo, useState } from "react";
import { X, Plus, Pencil, Paperclip, CalendarDays, UserRound, ArrowRight } from "lucide-react";
import { STATUS, ehLink } from "../lib/helpers";

const formatarData = (valor) => {
  if (!valor) return "—";

  const texto = String(valor);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return texto;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(data);
};

const dataHora = (valor) => {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(data);
};

const extrairEvidencia = (valor) => {
  if (!valor) return [];
  return Array.isArray(valor) ? valor.filter(Boolean) : [valor];
};

export default function ActionDetail({ acao, followUps = [], usuarios = [], meNome, podeEditarFollowUp, onClose, onSalvarFollowUp }) {
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    data_atualizacao: new Date().toISOString().slice(0, 10),
    descricao: "",
    status: acao?.status || "Não iniciada",
    observacao: "",
    proximos_passos: "",
    responsavel: meNome || "Todos",
    evidencia: "",
    arquivoUpload: null,
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const formularioInicial = () => ({
    data_atualizacao: new Date().toISOString().slice(0, 10),
    descricao: "",
    status: acao?.status || "Não iniciada",
    observacao: "",
    proximos_passos: "",
    responsavel: meNome || "Todos",
    evidencia: "",
    arquivoUpload: null,
  });

  const timeline = useMemo(() => {
    const entradas = [];

    if (acao) {
      entradas.push({
        id: `acao-${acao.id}`,
        tipo: "ação",
        data: acao.created_at || acao.updated_at,
        dataAtualizacao: acao.created_at || acao.updated_at,
        status: acao.status || "Não iniciada",
        responsavel: acao.responsavel || "Todos",
        descricao: acao.descricao || "Ação criada.",
        evidencia: extrairEvidencia(acao.evidencia),
        titulo: "Ação criada",
        obs: "Registro inicial da ação",
      });
    }

    (followUps || []).forEach((item) => {
      entradas.push({
        id: item.id || `${item.acao_id}-${item.created_at}`,
        tipo: "follow-up",
        data: item.data_atualizacao || item.created_at,
        dataAtualizacao: item.data_atualizacao || item.created_at,
        status: item.status || "Não iniciada",
        responsavel: item.responsavel || "Todos",
        descricao: item.descricao || "Atualização registrada.",
        evidencia: extrairEvidencia(item.evidencia),
        titulo: "Follow-up",
        obs: item.observacao || item.proximos_passos || "",
        proximosPassos: item.proximos_passos || "",
        followUp: item,
      });
    });

    return entradas.sort((a, b) => {
      const tA = new Date(a.data || a.dataAtualizacao || 0).getTime();
      const tB = new Date(b.data || b.dataAtualizacao || 0).getTime();
      return tB - tA;
    });
  }, [acao, followUps]);

  const setField = (key, value) => setForm((atual) => ({ ...atual, [key]: value }));

  const editarFollowUp = (item) => {
    setEditandoId(item.id);
    setForm({
      data_atualizacao: item.data_atualizacao || "",
      descricao: item.descricao || "",
      status: item.status || "Não iniciada",
      observacao: item.observacao || "",
      proximos_passos: item.proximos_passos || "",
      responsavel: item.responsavel || meNome || "Todos",
      evidencia: item.evidencia || "",
      arquivoUpload: null,
    });
    setErro("");
    setAberto(true);
  };

  const novoFollowUp = () => {
    setEditandoId(null);
    setForm(formularioInicial());
    setErro("");
    setAberto((v) => !v);
  };

  const salvar = async () => {
    if (!acao?.id) return;
    try {
      setSalvando(true);
      setErro("");
      await onSalvarFollowUp?.(acao.id, { ...form, id: editandoId });
      setAberto(false);
      setEditandoId(null);
      setForm(formularioInicial());
    } catch (e) {
      setErro(e.message || "Não foi possível salvar o follow-up.");
    } finally {
      setSalvando(false);
    }
  };

  if (!acao) return null;

  const evidenciaPrincipal = extrairEvidencia(acao.evidencia);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Ação</p>
            <h2 className="text-xl font-semibold text-slate-900">{acao.titulo || acao.descricao}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Responsável</p>
                <p className="font-medium text-slate-800">{acao.responsavel || "Todos"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status atual</p>
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">{acao.status || "Não iniciada"}</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Data de criação</p>
                <p className="font-medium text-slate-800">{formatarData(acao.created_at ? acao.created_at.slice(0, 10) : acao.prazo)}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Descrição</p>
              <p className="mt-1 text-slate-700">{acao.descricao}</p>
            </div>
            {evidenciaPrincipal.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-500">Evidência inicial</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {evidenciaPrincipal.map((item, idx) => {
                    const valor = String(item);
                    const isImage = valor.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(valor);
                    return (
                      <div key={`${valor}-${idx}`} className="rounded border border-slate-200 bg-white p-2">
                        {isImage ? (
                          <img src={valor} alt="Evidência inicial" className="max-h-28 rounded object-contain" />
                        ) : ehLink(valor) ? (
                          <a href={valor} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Abrir link</a>
                        ) : (
                          <span className="text-sm text-slate-600">{valor}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={novoFollowUp}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> + Adicionar Follow-up
            </button>
          </div>

          {aberto && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-slate-900">{editandoId ? "Editar follow-up" : "Registrar atualização"}</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Data da atualização</label>
                  <input type="date" value={form.data_atualizacao} onChange={(e) => setField("data_atualizacao", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Status</label>
                  <select value={form.status} onChange={(e) => setField("status", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Descrição da ação/movimentação</label>
                  <textarea rows={3} value={form.descricao} onChange={(e) => setField("descricao", e.target.value)} className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Responsável pela atualização</label>
                  <input value={form.responsavel} onChange={(e) => setField("responsavel", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Evidência/arquivo/foto</label>
                  <input value={form.evidencia} onChange={(e) => setField("evidencia", e.target.value)} placeholder="Link, texto, ou data URL" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <label className="mt-2 inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
                    <input type="file" className="hidden" onChange={(e) => {
                      const arquivo = e.target.files?.[0];
                      if (!arquivo) return;
                      setField("arquivoUpload", arquivo);
                      setField("evidencia", "Arquivo selecionado: " + arquivo.name);
                    }} />
                    Enviar arquivo real
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Observação / justificativa</label>
                  <textarea rows={2} value={form.observacao} onChange={(e) => setField("observacao", e.target.value)} className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Próximos passos</label>
                  <textarea rows={2} value={form.proximos_passos} onChange={(e) => setField("proximos_passos", e.target.value)} className="mt-1 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              {erro && <div className="mt-3 text-sm text-rose-600">{erro}</div>}

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => { setAberto(false); setEditandoId(null); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button onClick={salvar} disabled={salvando} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Salvar follow-up"}
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Histórico da Ação</h3>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.id} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  {index < timeline.length - 1 && <div className="absolute -bottom-4 left-6 top-0 w-px bg-slate-200" style={{ height: "calc(100% + 16px)" }} />}
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      {item.tipo === "ação" ? <CalendarDays className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{item.titulo}</div>
                      <div className="text-xs text-slate-500">{formatarData(item.dataAtualizacao?.slice(0, 10) || item.data?.slice(0, 10))}</div>
                    </div>
                    {item.tipo === "follow-up" && podeEditarFollowUp && (
                      <button
                        type="button"
                        onClick={() => editarFollowUp(item.followUp)}
                        title="Editar follow-up"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Status</div>
                      <div className="mt-1 text-sm text-slate-700">{item.status}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Responsável</div>
                      <div className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700"><UserRound className="h-3.5 w-3.5" /> {item.responsavel}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Descrição</div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{item.descricao}</p>
                  </div>

                  {item.obs && (
                    <div className="mt-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Observação</div>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{item.obs}</p>
                    </div>
                  )}

                  {item.proximosPassos && (
                    <div className="mt-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Próximos passos</div>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{item.proximosPassos}</p>
                    </div>
                  )}

                  {item.evidencia?.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs uppercase tracking-wide text-slate-400">Evidências</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.evidencia.map((valor, idx) => {
                          const texto = String(valor);
                          const isImage = texto.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(texto);
                          return isImage ? (
                            <a key={`${texto}-${idx}`} href={texto} target="_blank" rel="noreferrer" className="inline-flex max-w-[120px] overflow-hidden rounded border border-slate-200 bg-slate-50 p-1">
                              <img src={texto} alt="Evidência do histórico" className="h-16 w-full object-cover" />
                            </a>
                          ) : (
                            <a key={`${texto}-${idx}`} href={texto} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-blue-600 hover:bg-slate-100">
                              <Paperclip className="h-3.5 w-3.5" /> {texto.length > 30 ? `${texto.slice(0, 30)}...` : texto}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
