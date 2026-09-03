export type Categoria = "Medicamento" | "Descartável" | "Antisséptico" | "Instrumental" | "EPI";

export interface Insumo {
  id: string;
  nome: string;
  categoria: Categoria;
  unidade: string;
  quantidade: number;
  estoqueMinimo: number;
  consumoMensal: number;
  validade: string; // ISO date
  lote: string;
}

export interface Procedimento {
  id: string;
  nome: string;
  porMes: number;
  itens: { insumoId: string; quantidade: number }[];
}

export const insumos: Insumo[] = [
  { id: "luva-nitrilo", nome: "Luva de nitrilo (par)", categoria: "EPI", unidade: "pares", quantidade: 420, estoqueMinimo: 300, consumoMensal: 380, validade: "2027-04-30", lote: "LN-2291" },
  { id: "seringa-5ml", nome: "Seringa descartável 5 ml", categoria: "Descartável", unidade: "un", quantidade: 180, estoqueMinimo: 200, consumoMensal: 160, validade: "2026-11-15", lote: "SR-1180" },
  { id: "agulha-25x7", nome: "Agulha 25x7", categoria: "Descartável", unidade: "un", quantidade: 90, estoqueMinimo: 150, consumoMensal: 150, validade: "2026-09-20", lote: "AG-0442" },
  { id: "clorexidina", nome: "Clorexidina 2% 100 ml", categoria: "Antisséptico", unidade: "frascos", quantidade: 12, estoqueMinimo: 8, consumoMensal: 6, validade: "2026-09-12", lote: "CX-7731" },
  { id: "lidocaina", nome: "Lidocaína 2% 20 ml", categoria: "Medicamento", unidade: "frascos", quantidade: 24, estoqueMinimo: 10, consumoMensal: 9, validade: "2026-10-05", lote: "LD-3388" },
  { id: "gaze", nome: "Gaze estéril 7,5 cm", categoria: "Descartável", unidade: "pacotes", quantidade: 260, estoqueMinimo: 120, consumoMensal: 140, validade: "2028-01-31", lote: "GZ-5510" },
  { id: "fio-sutura", nome: "Fio de sutura Nylon 4-0", categoria: "Instrumental", unidade: "un", quantidade: 46, estoqueMinimo: 40, consumoMensal: 32, validade: "2027-06-30", lote: "FS-9021" },
  { id: "soro", nome: "Soro fisiológico 0,9% 500 ml", categoria: "Medicamento", unidade: "frascos", quantidade: 58, estoqueMinimo: 30, consumoMensal: 40, validade: "2026-12-18", lote: "SF-2245" },
  { id: "esparadrapo", nome: "Esparadrapo microporoso", categoria: "Descartável", unidade: "rolos", quantidade: 34, estoqueMinimo: 20, consumoMensal: 18, validade: "2027-02-28", lote: "EP-6612" },
  { id: "mascara", nome: "Máscara cirúrgica tripla", categoria: "EPI", unidade: "un", quantidade: 150, estoqueMinimo: 250, consumoMensal: 300, validade: "2026-09-08", lote: "MC-4407" },
  { id: "alcool70", nome: "Álcool 70% 1 L", categoria: "Antisséptico", unidade: "frascos", quantidade: 9, estoqueMinimo: 12, consumoMensal: 10, validade: "2026-10-25", lote: "AL-1129" },
  { id: "campo-esteril", nome: "Campo cirúrgico estéril", categoria: "Instrumental", unidade: "un", quantidade: 72, estoqueMinimo: 40, consumoMensal: 35, validade: "2027-08-14", lote: "CE-3390" },
];

export const procedimentos: Procedimento[] = [
  {
    id: "sutura",
    nome: "Sutura simples",
    porMes: 24,
    itens: [
      { insumoId: "luva-nitrilo", quantidade: 2 },
      { insumoId: "fio-sutura", quantidade: 1 },
      { insumoId: "gaze", quantidade: 3 },
      { insumoId: "clorexidina", quantidade: 0.2 },
      { insumoId: "lidocaina", quantidade: 0.3 },
      { insumoId: "campo-esteril", quantidade: 1 },
    ],
  },
  {
    id: "curativo",
    nome: "Curativo avançado",
    porMes: 60,
    itens: [
      { insumoId: "luva-nitrilo", quantidade: 1 },
      { insumoId: "gaze", quantidade: 2 },
      { insumoId: "soro", quantidade: 0.5 },
      { insumoId: "esparadrapo", quantidade: 0.2 },
      { insumoId: "mascara", quantidade: 1 },
    ],
  },
  {
    id: "medicacao",
    nome: "Medicação intramuscular",
    porMes: 90,
    itens: [
      { insumoId: "seringa-5ml", quantidade: 1 },
      { insumoId: "agulha-25x7", quantidade: 1 },
      { insumoId: "alcool70", quantidade: 0.05 },
      { insumoId: "luva-nitrilo", quantidade: 1 },
      { insumoId: "gaze", quantidade: 1 },
    ],
  },
  {
    id: "coleta",
    nome: "Coleta de sangue",
    porMes: 45,
    itens: [
      { insumoId: "seringa-5ml", quantidade: 1 },
      { insumoId: "agulha-25x7", quantidade: 1 },
      { insumoId: "luva-nitrilo", quantidade: 1 },
      { insumoId: "esparadrapo", quantidade: 0.1 },
      { insumoId: "alcool70", quantidade: 0.05 },
    ],
  },
];

export type NivelEstoque = "critico" | "atencao" | "ok";
export type NivelValidade = "vencido" | "usar-agora" | "proximo" | "ok";

export interface InsumoCalculado extends Insumo {
  mesesRestantes: number;
  diasParaVencer: number;
  nivelEstoque: NivelEstoque;
  nivelValidade: NivelValidade;
  precisaComprar: boolean;
  sugestaoCompra: number;
  perdaPrevista: number;
  procedimentos: string[];
}

const DIA = 1000 * 60 * 60 * 24;

export function calcularInsumos(hoje = new Date()): InsumoCalculado[] {
  return insumos.map((i) => {
    const mesesRestantes = i.consumoMensal > 0 ? i.quantidade / i.consumoMensal : Infinity;
    const diasParaVencer = Math.ceil((new Date(i.validade).getTime() - hoje.getTime()) / DIA);

    const nivelEstoque: NivelEstoque =
      i.quantidade <= i.estoqueMinimo * 0.75 || mesesRestantes < 0.75
        ? "critico"
        : i.quantidade <= i.estoqueMinimo || mesesRestantes < 1.5
          ? "atencao"
          : "ok";

    const nivelValidade: NivelValidade =
      diasParaVencer < 0 ? "vencido" : diasParaVencer <= 30 ? "usar-agora" : diasParaVencer <= 90 ? "proximo" : "ok";

    // consumo possível até a validade
    const consumoAteValidade = (i.consumoMensal * Math.max(diasParaVencer, 0)) / 30;
    const perdaPrevista = Math.max(0, Math.round(i.quantidade - consumoAteValidade));

    const cobertura = 3; // meses de cobertura desejada
    const sugestaoCompra = Math.max(0, Math.ceil(i.consumoMensal * cobertura - i.quantidade + perdaPrevista));
    const precisaComprar = nivelEstoque !== "ok" || nivelValidade === "vencido" || (nivelValidade === "usar-agora" && perdaPrevista > 0);

    const procs = procedimentos.filter((p) => p.itens.some((it) => it.insumoId === i.id)).map((p) => p.nome);

    return {
      ...i,
      mesesRestantes,
      diasParaVencer,
      nivelEstoque,
      nivelValidade,
      perdaPrevista,
      sugestaoCompra: precisaComprar ? sugestaoCompra : 0,
      precisaComprar,
      procedimentos: procs,
    };
  });
}

export function consumoPorProcedimento(insumoId: string) {
  return procedimentos
    .filter((p) => p.itens.some((it) => it.insumoId === insumoId))
    .map((p) => ({
      nome: p.nome,
      mensal: p.porMes * (p.itens.find((it) => it.insumoId === insumoId)?.quantidade ?? 0),
    }));
}
