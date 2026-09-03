import { createFileRoute } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { calcularInsumos, procedimentos } from "@/data/inventory";
import { EstoqueBadge } from "@/components/inventory-ui";

export const Route = createFileRoute("/procedimentos")({
  head: () => ({
    meta: [
      { title: "Insumos necessários por procedimento | MedEstoque" },
      {
        name: "description",
        content:
          "Veja quais insumos cada procedimento exige, quanto é consumido por mês e se o estoque atual cobre a demanda.",
      },
      { property: "og:title", content: "Insumos necessários por procedimento" },
      { property: "og:description", content: "Demanda mensal de insumos por procedimento e cobertura do estoque." },
    ],
  }),
  component: ProcedimentosPage,
});

function ProcedimentosPage() {
  const itens = calcularInsumos();
  const byId = Object.fromEntries(itens.map((i) => [i.id, i]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Procedimentos e insumos necessários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada procedimento lista os itens obrigatórios, a demanda mensal calculada e o status do estoque.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {procedimentos.map((p) => {
          const linhas = p.itens.map((it) => {
            const insumo = byId[it.insumoId];
            const demandaMes = it.quantidade * p.porMes;
            const cobre = insumo ? insumo.quantidade >= demandaMes : false;
            return { insumo, demandaMes, cobre, porProc: it.quantidade };
          });
          const faltando = linhas.filter((l) => !l.cobre).length;

          return (
            <Card key={p.id} className="shadow-card">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="size-5 text-primary" />
                  <div>
                    <CardTitle>{p.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">{p.porMes} procedimentos/mês</p>
                  </div>
                </div>
                {faltando > 0 ? (
                  <StatusBadge tone="critical">{faltando} item(ns) insuficiente(s)</StatusBadge>
                ) : (
                  <StatusBadge tone="success">Estoque cobre o mês</StatusBadge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {linhas.map(({ insumo, demandaMes, cobre, porProc }) =>
                  insumo ? (
                    <div
                      key={insumo.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{insumo.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {porProc} {insumo.unidade}/procedimento · {Math.ceil(demandaMes)} {insumo.unidade}/mês
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={cobre ? "info" : "warning"}>
                          {insumo.quantidade} em estoque
                        </StatusBadge>
                        <EstoqueBadge nivel={insumo.nivelEstoque} />
                      </div>
                    </div>
                  ) : null,
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
