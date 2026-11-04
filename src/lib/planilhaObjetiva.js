import readXlsxFile from "read-excel-file/browser";
import { codigoTurma } from "./helpers";

const norm = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const COLUNAS = {
  turma: ["turma", "classe", "codigo turma", "cod turma"],
  aluno: ["aluno", "nome", "nome aluno", "nome do aluno", "estudante"],
  percentual: ["percentual", "% acerto", "acerto", "percentual de acerto", "percentual acerto", "% de acerto", "desempenho", "nota", "%"],
};

const acharColuna = (cab, chaves) => {
  const n = cab.map(norm);
  for (const k of chaves) {
    const i = n.indexOf(norm(k));
    if (i >= 0) return i;
  }
  for (const k of chaves) {
    if (norm(k).length < 3) continue;
    const i = n.findIndex((h) => h.includes(norm(k)));
    if (i >= 0) return i;
  }
  return -1;
};

const lerNumero = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const t = String(v).replace("%", "").replace(/\s/g, "");
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isNaN(n) ? null : n;
};

function parseCsv(texto) {
  const sep = (texto.split(/\r?\n/, 1)[0].match(/;/g) || []).length >= (texto.split(/\r?\n/, 1)[0].match(/,/g) || []).length ? ";" : ",";
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = "";
    } else campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

export async function lerPlanilha(file) {
  if (/\.xlsx$/i.test(file.name)) return readXlsxFile(file);
  if (/\.(csv|txt)$/i.test(file.name)) return parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  throw new Error("Formato não suportado. Use .xlsx ou .csv.");
}

// Reconhece turma, aluno e percentual; casa a turma com as do calendário.
export function interpretarPlanilha(linhas, turmasCalendario) {
  const idxCab = linhas.findIndex((l) => l.some((c) => String(c ?? "").trim()));
  if (idxCab < 0) throw new Error("Planilha vazia.");
  const cab = linhas[idxCab].map((c) => String(c ?? ""));
  const iTurma = acharColuna(cab, COLUNAS.turma);
  const iAluno = acharColuna(cab, COLUNAS.aluno);
  const iPerc = acharColuna(cab, COLUNAS.percentual);
  const faltando = [iTurma < 0 && "turma", iAluno < 0 && "aluno", iPerc < 0 && "percentual"].filter(Boolean);
  if (faltando.length) {
    throw new Error(`Não encontrei a(s) coluna(s): ${faltando.join(", ")}. A primeira linha deve ter os títulos Turma, Aluno e Percentual.`);
  }

  const porCodigo = new Map(
    turmasCalendario.filter((t) => t && t.ativo !== false).map((t) => [norm(codigoTurma(t.titulo)), t])
  );

  const brutas = linhas.slice(idxCab + 1)
    .filter((l) => l.some((c) => String(c ?? "").trim()))
    .map((l, i) => ({
      linha: idxCab + i + 2,
      turmaTexto: String(l[iTurma] ?? "").trim(),
      aluno: String(l[iAluno] ?? "").trim(),
      valor: lerNumero(l[iPerc]),
    }));

  // Células formatadas como % no Excel chegam como fração (0-1).
  const validos = brutas.map((b) => b.valor).filter((v) => v !== null);
  const fracao = validos.length > 0 && validos.every((v) => v >= 0 && v <= 1) && validos.some((v) => v < 1);

  const ok = [];
  const erros = [];
  const vistos = new Set();
  for (const b of brutas) {
    const percentual = b.valor === null ? null : Math.round((fracao ? b.valor * 100 : b.valor) * 100) / 100;
    const turma = porCodigo.get(norm(codigoTurma(b.turmaTexto)));
    let erro = "";
    if (!b.aluno) erro = "aluno vazio";
    else if (!turma) erro = `turma "${b.turmaTexto || "(vazia)"}" não está no calendário`;
    else if (percentual === null || percentual < 0 || percentual > 100) erro = "percentual inválido (use 0 a 100)";
    else if (vistos.has(`${turma.id}|${norm(b.aluno)}`)) erro = "aluno repetido na mesma turma";
    if (erro) { erros.push({ linha: b.linha, aluno: b.aluno, erro }); continue; }
    vistos.add(`${turma.id}|${norm(b.aluno)}`);
    ok.push({ evento_id: turma.id, turma: codigoTurma(turma.titulo), aluno: b.aluno, percentual });
  }
  return { ok, erros };
}
