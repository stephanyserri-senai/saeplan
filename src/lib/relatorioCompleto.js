import { STATUS, codigoTurma, fmtData, hoje, statusEfetivo } from "./helpers";

const pct = (parte, total) => (total ? `${((parte / total) * 100).toFixed(1).replace(".", ",")}%` : "—");
const num = (v) => (v === null || v === undefined || v === "" ? "" : String(v).replace(".", ","));
const nomesResp = (a) => (Array.isArray(a.responsaveis) && a.responsaveis.length ? a.responsaveis : a.responsavel ? [a.responsavel] : []).join(", ");

export function exportarRelatorioCompleto({ acoes = [], turmas = [], provasObjetivas = [], provasPraticas = [], cursos = [], analises = [] }) {
  const turmasAtivas = turmas
    .filter((t) => t && t.ativo !== false)
    .sort((a, b) => codigoTurma(a.titulo).localeCompare(codigoTurma(b.titulo), "pt-BR"));
  const objPorEvento = Object.fromEntries(provasObjetivas.map((p) => [p.evento_id, p]));

  const contStatus = Object.fromEntries(STATUS.map((s) => [s, 0]));
  acoes.forEach((a) => { const s = statusEfetivo(a); contStatus[s] = (contStatus[s] || 0) + 1; });

  const objPreenchidas = turmasAtivas
    .map((t) => objPorEvento[t.id]?.percentual)
    .filter((v) => v !== null && v !== undefined)
    .map(Number);
  const mediaObj = objPreenchidas.length ? objPreenchidas.reduce((a, b) => a + b, 0) / objPreenchidas.length : null;

  const praticasPorTurma = (codigo) => provasPraticas.filter((p) => codigoTurma(p.turma) === codigo);
  const comData = provasPraticas.filter((p) => p.data_aplicacao).length;
  const comEvidencia = provasPraticas.filter((p) => p.evidencia_url).length;

  const ultimaAnalise = (cursoId) =>
    analises
      .filter((a) => a.curso_id === cursoId)
      .sort((a, b) => String(b.data_analise).localeCompare(String(a.data_analise)))[0];

  const linhas = [];
  const secao = (titulo, cab, dados) => {
    linhas.push([titulo], cab, ...dados, []);
  };

  linhas.push(["RELATÓRIO COMPLETO — PLANO DE AÇÃO SAEP"], [`Gerado em ${fmtData(hoje())}`], []);

  secao("MÉTRICAS GERAIS", ["Indicador", "Valor"], [
    ["Total de ações", acoes.length],
    ["Ações não iniciadas", contStatus["Não iniciada"] || 0],
    ["Ações em andamento", contStatus["Em andamento"] || 0],
    ["Ações concluídas", contStatus["Concluída"] || 0],
    ["Ações atrasadas", contStatus["Atrasada"] || 0],
    ["% de ações concluídas", pct(contStatus["Concluída"] || 0, acoes.length)],
    ["Turmas no calendário", turmasAtivas.length],
    ["Turmas com resultado da prova objetiva", `${objPreenchidas.length}/${turmasAtivas.length}`],
    ["Média de acerto da prova objetiva", mediaObj === null ? "—" : `${mediaObj.toFixed(1).replace(".", ",")}%`],
    ["Alunos registrados na prova prática", provasPraticas.length],
    ["Alunos com data de aplicação", `${comData} (${pct(comData, provasPraticas.length)})`],
    ["Alunos com evidência anexada", `${comEvidencia} (${pct(comEvidencia, provasPraticas.length)})`],
  ]);

  secao("AÇÕES", ["Título", "Descrição", "Responsáveis", "Curso/Área", "Prazo", "Status", "Evidência"],
    acoes.map((a) => [a.titulo || "", a.descricao || "", nomesResp(a), a.area || "", a.prazo ? fmtData(a.prazo) : "", statusEfetivo(a), a.evidencia || ""]));

  secao("PROVA OBJETIVA POR TURMA", ["Turma", "Data no calendário", "% de acerto", "Observação"],
    turmasAtivas.map((t) => {
      const r = objPorEvento[t.id];
      return [codigoTurma(t.titulo), t.data ? fmtData(t.data) : "", num(r?.percentual), r?.observacao || ""];
    }));

  secao("PROVA PRÁTICA — RESUMO POR TURMA", ["Turma", "Alunos", "Com data de aplicação", "% com data", "Com evidência", "% com evidência"],
    turmasAtivas.map((t) => {
      const codigo = codigoTurma(t.titulo);
      const alunos = praticasPorTurma(codigo);
      const d = alunos.filter((p) => p.data_aplicacao).length;
      const e = alunos.filter((p) => p.evidencia_url).length;
      return [codigo, alunos.length, d, pct(d, alunos.length), e, pct(e, alunos.length)];
    }));

  secao("PROVA PRÁTICA — ALUNOS", ["Turma", "Aluno", "Data de aplicação", "Evidência"],
    [...provasPraticas]
      .sort((a, b) => codigoTurma(a.turma).localeCompare(codigoTurma(b.turma), "pt-BR") || a.aluno.localeCompare(b.aluno, "pt-BR"))
      .map((p) => [codigoTurma(p.turma), p.aluno, p.data_aplicacao ? fmtData(p.data_aplicacao) : "", p.evidencia_url || ""]));

  secao("ANÁLISE DE PROGRESSO — ÚLTIMA POR CURSO", ["Curso", "Data da análise", "Resultado (%)"],
    cursos.filter((c) => c.ativo !== false).map((c) => {
      const a = ultimaAnalise(c.id);
      return [c.nome, a?.data_analise ? fmtData(String(a.data_analise).slice(0, 10)) : "", num(a?.resultado_percentual)];
    }));

  const esc = (c) => `"${String(c ?? "").replace(/"/g, '""')}"`;
  const csv = linhas.map((l) => l.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-completo-saep-${hoje()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
