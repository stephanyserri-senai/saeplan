import { supabase } from "../supabaseClient";

const normalizarNomeArquivo = (nome) => {
  const base = String(nome || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return base || "arquivo";
};

export async function uploadEvidenciaArquivo(file, prefix = "acoes") {
  if (!file) return null;

  const nomeBase = normalizarNomeArquivo(file.name);
  const extensao = nomeBase.includes(".") ? "" : ".bin";
  const caminho = `${prefix}/${Date.now()}-${nomeBase}${extensao}`;

  const { data, error } = await supabase.storage
    .from("acao-evidencias")
    .upload(caminho, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(error.message || "Não foi possível enviar a evidência.");
  }

  const { data: urlData } = supabase.storage
    .from("acao-evidencias")
    .getPublicUrl(data.path);

  return urlData?.publicUrl || null;
}
