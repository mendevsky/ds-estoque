import { supabase } from "@/integrations/supabase/client";

export interface Lote {
  id: string;
  insumo_id: string;
  clinica_id: string;
  lote: string;
  validade: string | null;
  quantidade: number;
}

export interface Insumo {
  id: string;
  clinica_id: string;
  nome: string;
  categoria: string;
  unidade: string;
  codigo_barras: string | null;
  localizacao: string;
  estoque_minimo: number;
  consumo_mensal_estimado: number;
  lotes: Lote[];
}

export interface Movimentacao {
  id: string;
  clinica_id: string;
  insumo_id: string;
  lote_id: string | null;
  procedimento_id: string | null;
  tipo: string;
  quantidade: number;
  localizacao: string;
  observacao: string;
  created_at: string;
}

export interface Procedimento {
  id: string;
  clinica_id: string;
  nome: string;
  descricao: string;
  procedimento_itens: { id: string; insumo_id: string; quantidade: number }[];
}

export type NivelEstoque = "critico" | "atencao" | "ok";
export type NivelValidade = "vencido" | "usar-agora" | "proximo" | "ok";

const DIA = 1000 * 60 * 60 * 24;

export function quantidadeTotal(i: Insumo) {
  return (i.lotes ?? []).reduce((s, l) => s + Number(l.quantidade), 0);
}

export function nivelEstoque(i: Insumo): NivelEstoque {
  const q = quantidadeTotal(i);
  const min = Number(i.estoque_minimo);
  if (q <= min * 0.75) return "critico";
  if (q <= min) return "atencao";
  return "ok";
}

export function diasParaVencer(validade: string | null, hoje = new Date()) {
  if (!validade) return Infinity;
  return Math.ceil((new Date(validade + "T00:00:00").getTime() - hoje.getTime()) / DIA);
}

export function nivelValidade(dias: number): NivelValidade {
  if (!isFinite(dias)) return "ok";
  if (dias < 0) return "vencido";
  if (dias <= 30) return "usar-agora";
  if (dias <= 90) return "proximo";
  return "ok";
}

export function loteMaisProximo(i: Insumo) {
  const comSaldo = (i.lotes ?? []).filter((l) => Number(l.quantidade) > 0 && l.validade);
  if (comSaldo.length === 0) return null;
  return comSaldo.sort((a, b) => (a.validade! < b.validade! ? -1 : 1))[0]!;
}

/** Consumo mensal real, a partir das saídas dos últimos 90 dias (fallback: estimativa cadastrada). */
export function consumoMensalReal(insumo: Insumo, movs: Movimentacao[]) {
  const limite = Date.now() - 90 * DIA;
  const saidas = movs.filter(
    (m) => m.insumo_id === insumo.id && m.tipo === "saida" && new Date(m.created_at).getTime() >= limite,
  );
  if (saidas.length === 0) return Number(insumo.consumo_mensal_estimado);
  const total = saidas.reduce((s, m) => s + Number(m.quantidade), 0);
  return (total / 90) * 30;
}

export function mesesRestantes(insumo: Insumo, consumo: number) {
  if (consumo <= 0) return Infinity;
  return quantidadeTotal(insumo) / consumo;
}

export function sugestaoCompra(insumo: Insumo, consumo: number, cobertura = 3) {
  return Math.max(0, Math.ceil(consumo * cobertura - quantidadeTotal(insumo)));
}

export function formatData(iso: string | null) {
  if (!iso) return "sem validade";
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export function formatMeses(m: number) {
  if (!isFinite(m)) return "—";
  return `${m.toFixed(1)} meses`;
}

/* ---------- queries ---------- */

export async function fetchInsumos(clinicaId: string) {
  const { data, error } = await supabase
    .from("insumos")
    .select("*, lotes(*)")
    .eq("clinica_id", clinicaId)
    .order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Insumo[];
}

export async function fetchMovimentacoes(clinicaId: string) {
  const { data, error } = await supabase
    .from("movimentacoes")
    .select("*")
    .eq("clinica_id", clinicaId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as Movimentacao[];
}

export async function fetchProcedimentos(clinicaId: string) {
  const { data, error } = await supabase
    .from("procedimentos")
    .select("*, procedimento_itens(*)")
    .eq("clinica_id", clinicaId)
    .order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Procedimento[];
}
