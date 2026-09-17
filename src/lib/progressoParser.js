const limparTexto = (valor) => String(valor || "").replace(/\s+/g, " ").trim();

const normalizarTexto = (valor) => limparTexto(valor)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const percentual = (valor) => {
  const encontrado = String(valor || "").match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!encontrado) return null;
  const numero = Number(encontrado[1].replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
};

const numero = (valor) => {
  const encontrado = String(valor || "").match(/\d+(?:[.,]\d+)?/);
  if (!encontrado) return null;
  const resultado = Number(encontrado[0].replace(",", "."));
  return Number.isFinite(resultado) ? resultado : null;
};

const dataIso = (valor) => {
  const encontrado = String(valor || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!encontrado) return null;
  const [, dia, mes, ano] = encontrado;
  const data = new Date(`${ano}-${mes}-${dia}T12:00:00`);
  if (Number.isNaN(data.getTime())) return null;
  return `${ano}-${mes}-${dia}`;
};

const dataLocalHoje = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const textoCorpo = (documento) => {
  const corpo = documento.body?.cloneNode(true);
  if (!corpo) return "";

  corpo.querySelectorAll("br, div, p, h1, h2, h3, h4, h5, h6, tr, th, td, li").forEach((elemento) => {
    elemento.insertBefore(documento.createTextNode(" "), elemento.firstChild);
  });

  return limparTexto(corpo.textContent || "");
};

const removerConteudoExecutavel = (documento) => {
  documento.querySelectorAll("script, style, iframe, object, embed, link, meta, base, template").forEach((elemento) => elemento.remove());
};

const tabelaPorCabecalhos = (documento, cabecalhosEsperados) => {
  return Array.from(documento.querySelectorAll("table")).find((tabela) => {
    const linhaCabecalho = tabela.querySelector("thead tr") || tabela.querySelector("tr");
    const cabecalhos = Array.from(linhaCabecalho?.querySelectorAll(":scope > th, :scope > td") || [])
      .map((celula) => normalizarTexto(celula.textContent));
    return cabecalhosEsperados.every((cabecalho) => cabecalhos.some((item) => item.includes(normalizarTexto(cabecalho))));
  });
};

const linhasTabela = (tabela) => {
  if (!tabela) return [];
  const linhas = Array.from(tabela.querySelectorAll("tbody tr"));
  const linhasFonte = linhas.length ? linhas : Array.from(tabela.querySelectorAll("tr")).slice(1);
  return linhasFonte
    .map((linha) => Array.from(linha.querySelectorAll("th, td")).map((celula) => limparTexto(celula.textContent)))
    .filter((linha) => linha.length > 0);
};

const extrairCurso = (documento) => {
  const titulo = limparTexto(documento.querySelector("title")?.textContent);
  const doTitulo = titulo.match(/(?:SAEP\s*BI\s*[—-]\s*)(.+)$/i)?.[1];
  if (doTitulo) return doTitulo.trim();

  const gerado = Array.from(documento.querySelectorAll("div, span, p"))
    .map((elemento) => limparTexto(elemento.textContent))
    .find((texto) => texto.length > 3 && texto.length < 100 && !/gerado em|todas as turmas/i.test(texto));
  return gerado || null;
};

const extrairCapacidades = (documento) => {
  const tabela = tabelaPorCabecalhos(documento, ["Cap.", "Descrição da Capacidade", "% Acerto"]);
  return linhasTabela(tabela).map((linha) => ({
    codigo: linha[0] || null,
    descricao: linha[1] || null,
    quantidadeQuestoes: numero(linha[2]),
    percentual: percentual(linha[3]),
  })).filter((item) => item.codigo && item.percentual !== null);
};

const extrairDificuldades = (documento) => {
  const tabela = tabelaPorCabecalhos(documento, ["Nível de Dificuldade", "Qtd. Questões", "% Médio de Acerto"]);
  return linhasTabela(tabela).map((linha) => ({
    nivel: linha[0] || null,
    quantidadeQuestoes: numero(linha[1]),
    percentual: percentual(linha[2]),
  })).filter((item) => item.nivel && item.percentual !== null);
};

const extrairQuestoesAtencao = (documento) => {
  const tabela = tabelaPorCabecalhos(documento, ["Q", "% Acerto", "Capacidade", "Ação"]);
  return linhasTabela(tabela).map((linha) => ({
    questao: linha[0] || null,
    percentual: percentual(linha[1]),
    capacidade: linha[2] || null,
    subfuncao: linha[3] || null,
    objeto: linha[4] || null,
    dificuldade: linha[5] || null,
    acao: linha[6] || null,
  })).filter((item) => item.questao && item.percentual !== null);
};

const extrairAlunos = (documento) => {
  const tabela = tabelaPorCabecalhos(documento, ["Aluno", "Turma", "Nota", "%", "Situação"]);
  return linhasTabela(tabela).map((linha) => ({
    ordem: numero(linha[0]),
    nome: linha[1] || null,
    turma: linha[2] || null,
    nota: percentual(linha[3]),
    percentual: percentual(linha[4]),
    situacao: linha[5] || null,
  })).filter((item) => item.nome && item.percentual !== null);
};

const extrairDistribuicao = (texto) => {
  const niveis = ["Abaixo do Básico", "Básico", "Adequado", "Avançado"];
  return niveis.map((nivel) => {
    const inicio = normalizarTexto(texto).indexOf(normalizarTexto(nivel));
    if (inicio < 0) return null;
    const trecho = texto.slice(inicio, inicio + 100);
    const encontrado = trecho.match(/(\d+)\s+alunos?\s*[—-]\s*(\d+(?:[.,]\d+)?)\s*%/i);
    if (!encontrado) return null;
    return { nivel, alunos: Number(encontrado[1]), percentual: Number(encontrado[2].replace(",", ".")) };
  }).filter(Boolean);
};

export function parseRelatorioProgresso(html, importadoEm = new Date()) {
  if (typeof DOMParser === "undefined") {
    throw new Error("Este navegador não oferece suporte à leitura segura de HTML.");
  }

  const documento = new DOMParser().parseFromString(String(html || ""), "text/html");
  removerConteudoExecutavel(documento);
  const texto = textoCorpo(documento);
  const alertas = [];
  const titulo = limparTexto(documento.querySelector("title")?.textContent) || null;
  const cursoExtraido = extrairCurso(documento);
  const geradoTexto = texto.match(/Gerado em\s+(\d{2}\/\d{2}\/\d{4}(?:,\s*\d{2}:\d{2})?)/i)?.[1] || null;
  const dataAnalise = dataIso(geradoTexto) || dataLocalHoje();
  const dataOrigem = geradoTexto ? "html" : "importacao";

  const resultadoTexto = texto.match(/Nota Média\s+(\d+(?:[.,]\d+)?)%/i);
  const aprovadoTexto = texto.match(/Aprovados[^\d]*(\d+)\/(\d+)\s+(\d+(?:[.,]\d+)?)%/i);
  const dificilTexto = texto.match(/Questão mais difícil\s+(Q\d+)\s*\((\d+(?:[.,]\d+)?)%\)/i);
  const mediaAcertosTexto = texto.match(/Média de\s+(\d+(?:[.,]\d+)?)\s+acertos/i);
  const alunosTexto = texto.match(/Alunos analisados\s+(\d+)/i);
  const capacidades = extrairCapacidades(documento);
  const dificuldades = extrairDificuldades(documento);
  const questoesAtencao = extrairQuestoesAtencao(documento);
  const alunos = extrairAlunos(documento);
  const distribuicao = extrairDistribuicao(texto);

  if (!cursoExtraido) alertas.push("O curso não foi identificado no HTML; confirme o curso selecionado.");
  if (!resultadoTexto) alertas.push("O resultado percentual não foi identificado no HTML.");
  if (!geradoTexto) alertas.push("A data da análise não foi identificada; foi usada a data da importação.");
  capacidades.filter((item) => item.percentual < 50).forEach((item) => {
    alertas.push(`${item.codigo} abaixo de 50% (${item.percentual}%).`);
  });
  if (!capacidades.length) alertas.push("Nenhum indicador de capacidade foi identificado.");

  return {
    cursoExtraido,
    dataAnalise,
    dataOrigem,
    resultadoPercentual: resultadoTexto ? Number(resultadoTexto[1].replace(",", ".")) : null,
    dadosExtraidos: {
      titulo,
      geradoEm: geradoTexto,
      alunosAnalisados: alunosTexto ? Number(alunosTexto[1]) : alunos.length || null,
      mediaAcertos: mediaAcertosTexto ? Number(mediaAcertosTexto[1].replace(",", ".")) : null,
      aprovados: aprovadoTexto ? Number(aprovadoTexto[1]) : null,
      totalAlunos: aprovadoTexto ? Number(aprovadoTexto[2]) : null,
      aprovacaoPercentual: aprovadoTexto ? Number(aprovadoTexto[3].replace(",", ".")) : null,
      questaoMaisDificil: dificilTexto ? { questao: dificilTexto[1], percentual: Number(dificilTexto[2].replace(",", ".")) } : null,
      distribuicaoProficiencia: distribuicao,
      questoesAtencao,
      alunos,
    },
    indicadores: {
      capacidades,
      dificuldades,
    },
    alertas,
    importadoEm: importadoEm.toISOString(),
  };
}

export const formatarPercentual = (valor) => valor === null || valor === undefined ? "—" : `${String(valor).replace(".", ",")}%`;

export const formatarDataAnalise = (valor) => {
  if (!valor) return "—";
  const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : String(valor);
};
