import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { STATUS } from "../lib/helpers";

export default function ActionForm({ inicial, meNome, usuarios = [], onSalvar, onFechar }) {
  const opcoesResponsaveis = useMemo(() => {
    const nomes = (usuarios || [])
      .map((u) => u.nome || u.email)
      .filter(Boolean);
    return ["Todos", ...new Set([...nomes, meNome].filter(Boolean))];
  }, [meNome, usuarios]);

  const valorInicial = useMemo(() => {
    const responsaveis = Array.isArray(inicial?.responsaveis) && inicial.responsaveis.length
      ? inicial.responsaveis
      : inicial?.responsavel
        ? [inicial.responsavel]
        : [meNome].filter(Boolean);

    return inicial || {
      id: null,
      titulo: "",
      descricao: "",
      responsavel: responsaveis[0] || meNome || "",
      responsaveis,
      area: "",
      prazo: "",
      status: "Não iniciada",
      evidencia: "",
    };
  }, [inicial, meNome]);

  useEffect(() => {
    if (!f.evidencia) return;
    if (typeof f.evidencia === "string" && f.evidencia.startsWith("data:image/")) {
      setErro("");
    }
  }, [f.evidencia]);

  const [f, setF] = useState(valorInicial);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setF(valorInicial);
  }, [valorInicial]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const toggleResponsavel = (nome) => {
    setF((p) => {
      const atual = Array.isArray(p.responsaveis) ? p.responsaveis : [];
      let proximo = atual.includes(nome)
        ? atual.filter((item) => item !== nome)
        : [...atual, nome];

      if (nome === "Todos") {
        proximo = proximo.includes("Todos") ? [] : ["Todos"];
      } else if (proximo.includes("Todos")) {
        proximo = proximo.filter((item) => item !== "Todos");
      }

      const responsavel = proximo.includes("Todos") ? "Todos" : (proximo[0] || "");
      return { ...p, responsaveis: proximo, responsavel };
    });
    setErro("");
  };

  const handleImagemEvidencia = (event) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onload = () => {
      set("evidencia", String(reader.result || ""));
    };
    reader.readAsDataURL(arquivo);
  };

  const salvar = async () => {
    if (!f.descricao.trim()) {
      setErro("Descreva o que foi ou será feito.");
      return;
    }

    const responsaveis = Array.from(new Set((f.responsaveis || []).map((r) => String(r).trim()).filter(Boolean)));
    if (!responsaveis.length) {
      setErro("Selecione ao menos um responsável ou a opção Todos.");
      return;
    }

    setSalvando(true);
    try {
      await onSalvar({
        ...f,
        responsaveis,
        responsavel: responsaveis.includes("Todos") ? "Todos" : responsaveis[0],
      });
    } catch (e) {
      setErro(e.message || "Não foi possível salvar.");
      setSalvando(false);
    }
  };

  const evidenciaEhImagem = typeof f.evidencia === "string" && (
    f.evidencia.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(f.evidencia)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{f.id ? "Editar ação" : "Nova ação"}</h2>
          <button onClick={onFechar} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Título <span className="text-slate-400">(opcional)</span></label>
            <input
              value={f.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              placeholder="Ex.: Reforço em Lei de Ohm"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Descrição do que foi/será feito</label>
            <textarea
              value={f.descricao}
              onChange={(e) => { set("descricao", e.target.value); setErro(""); }}
              rows={3}
              placeholder="Descreva a ação de melhoria vinculada ao resultado do SAEP."
              className="mt-1 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Responsáveis</label>
            <div className="mt-2 space-y-2 rounded-lg border border-slate-300 bg-slate-50 p-3">
              {opcoesResponsaveis.map((nome) => {
                const checked = (f.responsaveis || []).includes(nome);
                return (
                  <label key={nome} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleResponsavel(nome)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{nome}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-400">Selecione uma ou mais pessoas. A opção “Todos” torna a ação visível para qualquer usuário.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Curso / Área <span className="text-slate-400">(opcional)</span></label>
              <input
                value={f.area}
                onChange={(e) => set("area", e.target.value)}
                placeholder="Ex.: Eletrotécnica"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Prazo</label>
              <input
                type="date"
                value={f.prazo || ""}
                onChange={(e) => set("prazo", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              value={f.status}
              onChange={(e) => set("status", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Evidência</label>
            <input
              value={f.evidencia}
              onChange={(e) => set("evidencia", e.target.value)}
              placeholder="Cole um link, texto ou cole uma imagem em base64/data URL"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
                <input type="file" accept="image/*" className="hidden" onChange={handleImagemEvidencia} />
                Enviar imagem
              </label>
            </div>
            {evidenciaEhImagem && (
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                <img src={f.evidencia} alt="Evidência da ação" className="max-h-52 w-full rounded object-contain" />
              </div>
            )}
            <p className="mt-1 text-xs text-slate-400">Você pode colar um link externo ou enviar uma imagem diretamente. A imagem será armazenada no campo de evidência do banco em formato data URL.</p>
          </div>

          {erro && <div className="text-sm text-rose-600">{erro}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button onClick={onFechar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {f.id ? "Salvar alterações" : "Adicionar ação"}
          </button>
        </div>
      </div>
    </div>
  );
}
