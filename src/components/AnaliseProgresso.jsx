import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, FileUp, LineChart, Plus, Save, Upload } from "lucide-react";
import { formatarDataAnalise, formatarPercentual, parseRelatorioProgresso } from "../lib/progressoParser";

const dataImportacao = (valor) => valor ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor)) : "—";
const CURSO_REMOVIDO = "instrumentacao industrial";

const cursoLegado = (nome) => String(nome || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase() === CURSO_REMOVIDO;

function GraficoEvolucao({ analises }) {
  const pontos = analises.filter((item) => item.resultado_percentual !== null && item.resultado_percentual !== undefined);
  if (!pontos.length) return <p className="text-sm text-slate-400">Nenhum resultado percentual disponível para o gráfico.</p>;

  const largura = 720;
  const altura = 230;
  const margem = { topo: 18, direita: 20, baixo: 42, esquerda: 42 };
  const areaLargura = largura - margem.esquerda - margem.direita;
  const areaAltura = altura - margem.topo - margem.baixo;
  const x = (index) => pontos.length === 1 ? margem.esquerda + areaLargura / 2 : margem.esquerda + (index / (pontos.length - 1)) * areaLargura;
  const y = (valor) => margem.topo + ((100 - Number(valor)) / 100) * areaAltura;
  const linha = pontos.map((item, index) => `${x(index)},${y(item.resultado_percentual)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${largura} ${altura}`} className="h-auto min-w-[620px] w-full" role="img" aria-label="Evolução do curso">
        {[0, 25, 50, 75, 100].map((valor) => (
          <g key={valor}>
            <line x1={margem.esquerda} x2={largura - margem.direita} y1={y(valor)} y2={y(valor)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={margem.esquerda - 8} y={y(valor) + 4} textAnchor="end" fontSize="11" fill="#64748b">{valor}%</text>
          </g>
        ))}
        <polyline points={linha} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {pontos.map((item, index) => (
          <g key={item.id}>
            <circle cx={x(index)} cy={y(item.resultado_percentual)} r="5" fill="#fff" stroke="#2563eb" strokeWidth="3" />
            <text x={x(index)} y={y(item.resultado_percentual) - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1d4ed8">{formatarPercentual(item.resultado_percentual)}</text>
            <text x={x(index)} y={altura - 18} textAnchor="middle" fontSize="10" fill="#64748b">{formatarDataAnalise(item.data_analise)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function AnaliseProgresso({ cursos = [], analises = [], isAdmin, onImportar, onCriarCurso }) {
  const [cursoId, setCursoId] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState(false);
  const [novoCurso, setNovoCurso] = useState("");

  useEffect(() => {
    if (!cursoId && cursos.length) setCursoId(cursos[0].id);
    if (cursoId && !cursos.some((curso) => curso.id === cursoId)) setCursoId(cursos[0]?.id || "");
  }, [cursoId, cursos]);

  const analisesCurso = useMemo(() => analises
    .filter((item) => item.curso_id === cursoId)
    .sort((a, b) => `${a.data_analise}-${a.importado_em}`.localeCompare(`${b.data_analise}-${b.importado_em}`)), [analises, cursoId]);
  const cursoAtual = cursos.find((curso) => curso.id === cursoId);
  const atual = analisesCurso[analisesCurso.length - 1];
  const anterior = analisesCurso[analisesCurso.length - 2];
  const variacao = atual?.resultado_percentual !== null && anterior?.resultado_percentual !== null && atual && anterior
    ? Number(atual.resultado_percentual) - Number(anterior.resultado_percentual)
    : null;
  const ultimaData = atual?.data_analise;
  const htmlRelatorio = preview?.htmlSeguro || atual?.html_sanitizado || "";

  const analisarArquivo = async () => {
    if (!arquivo) return setErro("Selecione um arquivo HTML.");
    if (!cursoId) return setErro("Selecione um curso antes de analisar.");
    try {
      setProcessando(true);
      setErro("");
      setMensagem("");
      const conteudo = await arquivo.text();
      setPreview(parseRelatorioProgresso(conteudo));
    } catch (e) {
      setPreview(null);
      setErro(e.message || "Não foi possível analisar o HTML.");
    } finally {
      setProcessando(false);
    }
  };

  const salvarAnalise = async () => {
    if (!preview || !arquivo || !cursoId) return;
    try {
      setProcessando(true);
      setErro("");
      await onImportar({ cursoId, arquivoNome: arquivo.name, dados: preview });
      setMensagem("Análise salva. Ela foi adicionada ao histórico do curso.");
      setArquivo(null);
      setPreview(null);
    } catch (e) {
      setErro(e.message || "Não foi possível salvar a análise.");
    } finally {
      setProcessando(false);
    }
  };

  const cadastrarCurso = async () => {
    const nome = novoCurso.trim();
    if (!nome) return;
    try {
      setProcessando(true);
      setErro("");
      const curso = await onCriarCurso(nome);
      setCursoId(curso.id);
      setNovoCurso("");
      setMensagem("Curso cadastrado.");
    } catch (e) {
      setErro(e.message || "Não foi possível cadastrar o curso.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-700" /><h2 className="text-lg font-semibold text-slate-900">Análise de Progresso</h2></div>
          <p className="mt-1 text-sm text-slate-500">Importe cada relatório como uma nova fotografia do desempenho do curso.</p>
        </div>
        {cursoAtual && <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">Curso: <strong>{cursoAtual.nome}</strong></div>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><Upload className="h-4 w-4 text-blue-700" /><h3 className="text-sm font-semibold text-slate-900">Nova importação</h3></div>
          <label className="mt-4 block text-sm font-medium text-slate-700">Curso</label>
          <select value={cursoId} onChange={(e) => { setCursoId(e.target.value); setPreview(null); }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="">Selecione um curso</option>
            {cursos.filter((curso) => !cursoLegado(curso.nome)).map((curso) => <option key={curso.id} value={curso.id}>{curso.nome}</option>)}
          </select>
          {isAdmin && <div className="mt-3 flex gap-2"><input value={novoCurso} onChange={(e) => setNovoCurso(e.target.value)} placeholder="Cadastrar novo curso" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" /><button type="button" onClick={cadastrarCurso} disabled={processando || !novoCurso.trim()} title="Cadastrar curso" className="rounded-lg bg-slate-800 px-3 py-2 text-white disabled:opacity-50"><Plus className="h-4 w-4" /></button></div>}
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center hover:border-blue-400 hover:bg-blue-50/40">
            <FileUp className="h-7 w-7 text-slate-400" />
            <span className="mt-2 text-sm font-medium text-slate-700">{arquivo ? arquivo.name : "Selecionar arquivo .html"}</span>
            <span className="mt-1 text-xs text-slate-400">O relatório será exibido com o layout original, sem executar scripts.</span>
            <input type="file" accept=".html,text/html" className="hidden" onChange={(e) => { setArquivo(e.target.files?.[0] || null); setPreview(null); setErro(""); }} />
          </label>
          <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={analisarArquivo} disabled={processando || !arquivo || !cursoId} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Analisar</button>{preview && <button type="button" onClick={salvarAnalise} disabled={processando} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"><Save className="h-4 w-4" /> Salvar análise</button>}</div>
          {preview && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> Prévia identificada</div><div className="mt-2 grid grid-cols-2 gap-2 text-xs"><span>Curso no HTML: {preview.cursoExtraido || "não identificado"}</span><span>Data: {formatarDataAnalise(preview.dataAnalise)}</span><span>Resultado: {formatarPercentual(preview.resultadoPercentual)}</span><span>Indicadores: {preview.indicadores.capacidades.length}</span></div></div>}
          {erro && <div className="mt-3 flex gap-2 text-sm text-rose-600"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{erro}</div>}
          {mensagem && <div className="mt-3 text-sm text-emerald-700">{mensagem}</div>}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><LineChart className="h-4 w-4 text-blue-700" /><h3 className="text-sm font-semibold text-slate-900">Evolução do curso</h3></div><span className="text-xs text-slate-400">{analisesCurso.length} análise(s)</span></div>
          {!cursoId ? <p className="mt-8 text-sm text-slate-400">Selecione um curso para reconstruir sua evolução.</p> : <><div className="mt-4"><GraficoEvolucao analises={analisesCurso} /></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Resultado atual</div><div className="mt-1 text-xl font-semibold text-blue-700">{formatarPercentual(atual?.resultado_percentual)}</div></div><div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Última análise</div><div className="mt-1 text-sm font-semibold text-slate-800">{formatarDataAnalise(ultimaData)}</div></div><div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Variação</div><div className={`mt-1 text-xl font-semibold ${variacao === null ? "text-slate-400" : variacao >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{variacao === null ? "—" : `${variacao >= 0 ? "+" : ""}${String(variacao).replace(".", ",")} p.p.`}</div></div></div>{atual && <p className="mt-3 text-xs text-slate-500">Resultado anterior: {formatarPercentual(anterior?.resultado_percentual)} · Resultado atual: {formatarPercentual(atual.resultado_percentual)}.</p>}</>}
        </section>
      </div>

      {htmlRelatorio && <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-900">Relatório importado</h3><p className="mt-1 text-xs text-slate-500">Conteúdo exibido com scripts e navegação perigosa removidos.</p></div>{preview && <span className="text-xs font-medium text-emerald-700">Prévia</span>}</div><iframe title="Relatório HTML importado" srcDoc={htmlRelatorio} sandbox="" className="mt-4 h-[900px] w-full rounded-lg border border-slate-200 bg-white" /></section>}

      <section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">Histórico de análises</h3><span className="text-xs text-slate-400">Ordenado pela data da análise</span></div>{analisesCurso.length === 0 ? <p className="mt-4 text-sm text-slate-400">Nenhuma análise salva para este curso.</p> : <div className="mt-4 space-y-3">{[...analisesCurso].reverse().map((item) => <details key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-sm"><span className="font-medium text-slate-800">{formatarDataAnalise(item.data_analise)} · {item.arquivo_nome}</span><span className="font-semibold text-blue-700">{formatarPercentual(item.resultado_percentual)}</span></summary><div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600 sm:grid-cols-2"><span>Importado em: {dataImportacao(item.importado_em)}</span><span>Curso: {cursoAtual?.nome || "—"}</span><span>Indicadores extraídos: {item.indicadores?.capacidades?.length || 0}</span><span>Alertas: {item.alertas?.length || 0}</span></div>{item.alertas?.length > 0 && <div className="mt-3 space-y-1 text-xs text-amber-800">{item.alertas.map((alerta, index) => <div key={`${item.id}-alerta-${index}`} className="flex gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{alerta}</div>)}</div>}</details>)}</div>}</section>
    </div>
  );
}
