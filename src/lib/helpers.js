export const STATUS = ["Não iniciada", "Em andamento", "Concluída", "Atrasada"];

export const hoje = () => new Date().toISOString().slice(0, 10);

export const estaAtrasada = (a) =>
  a.prazo && a.prazo < hoje() && a.status !== "Concluída";

export const statusEfetivo = (a) => (estaAtrasada(a) ? "Atrasada" : a.status);

export const fmtData = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export const ehLink = (t) => /^https?:\/\//i.test(t || "");

export function exportarCSV(acoes) {
  const cab = ["Título", "Descrição", "Responsável", "Curso/Área", "Prazo", "Status", "Evidência", "Atualizado em"];
  const linha = (a) => [
    a.titulo || "",
    a.descricao || "",
    a.responsavel || "",
    a.area || "",
    a.prazo ? fmtData(a.prazo) : "",
    statusEfetivo(a),
    a.evidencia || "",
    a.updated_at ? new Date(a.updated_at).toLocaleString("pt-BR") : "",
  ];
  const esc = (c) => `"${String(c).replace(/"/g, '""')}"`;
  const csv = [cab, ...acoes.map(linha)].map((l) => l.map(esc).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `plano-acao-saep-${hoje()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
