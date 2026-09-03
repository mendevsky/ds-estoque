import { useQuery } from "@tanstack/react-query";
import {
  consumoMensalReal,
  fetchInsumos,
  fetchMovimentacoes,
  fetchProcedimentos,
  loteMaisProximo,
  mesesRestantes,
  nivelEstoque,
  quantidadeTotal,
  sugestaoCompra,
  diasParaVencer,
  type Insumo,
  type Movimentacao,
  type NivelEstoque,
} from "@/lib/estoque";

export interface InsumoCalculado extends Insumo {
  quantidade: number;
  consumoMensal: number;
  meses: number;
  nivel: NivelEstoque;
  diasValidade: number;
  loteCritico: ReturnType<typeof loteMaisProximo>;
  sugestao: number;
}

export function calcular(insumos: Insumo[], movs: Movimentacao[]): InsumoCalculado[] {
  return insumos.map((i) => {
    const consumoMensal = consumoMensalReal(i, movs);
    const lote = loteMaisProximo(i);
    return {
      ...i,
      quantidade: quantidadeTotal(i),
      consumoMensal,
      meses: mesesRestantes(i, consumoMensal),
      nivel: nivelEstoque(i),
      diasValidade: diasParaVencer(lote?.validade ?? null),
      loteCritico: lote,
      sugestao: sugestaoCompra(i, consumoMensal),
    };
  });
}

export function useDadosClinica(clinicaId: string | null) {
  const insumos = useQuery({
    queryKey: ["insumos", clinicaId],
    queryFn: () => fetchInsumos(clinicaId!),
    enabled: !!clinicaId,
  });
  const movs = useQuery({
    queryKey: ["movimentacoes", clinicaId],
    queryFn: () => fetchMovimentacoes(clinicaId!),
    enabled: !!clinicaId,
  });
  const procedimentos = useQuery({
    queryKey: ["procedimentos", clinicaId],
    queryFn: () => fetchProcedimentos(clinicaId!),
    enabled: !!clinicaId,
  });

  const itens = calcular(insumos.data ?? [], movs.data ?? []);

  return {
    itens,
    movimentacoes: movs.data ?? [],
    procedimentos: procedimentos.data ?? [],
    carregando: insumos.isLoading || movs.isLoading || procedimentos.isLoading,
  };
}
