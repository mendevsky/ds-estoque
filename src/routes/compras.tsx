import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { calcularInsumos } from "@/data/inventory";
import { EstoqueBadge, ValidadeBadge, formatData, formatMeses } from "@/components/inventory-ui";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Processo de compras: o que repor agora | MedEstoque" },
      {
        name: "description",
        content:
          "Sugestão automática de compra por insumo, calculada a partir do consumo mensal, do estoque atual e da validade dos lotes.",
      },
      { property: "og:title", content: "Processo de compras: o que repor agora" },
      { property: "og:description", content: "Sugestão de reposição baseada em consumo, estoque e validade." },
    ],
  }),
  component: ComprasPage,
});

function ComprasPage() {
  const itens = calcularInsumos();
  const comprar = itens.filter((i) => i.precisaComprar).sort((a, b) => a.mesesRestantes - b.mesesRestantes);
  const ok = itens.filter((i) => !i.precisaComprar);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Processo de compras</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sinalização automática de reposição para manter 3 meses de cobertura, considerando o consumo mensal e a perda
          prevista por vencimento.
        </p>
      </header>

      <Card className="border-info/30 bg-info/5 shadow-card">
        <CardContent className="flex gap-3 pt-6 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          <p>
            Cálculo: <strong>sugestão = (consumo mensal × 3) − estoque atual + perda prevista</strong>. A perda prevista
            é a parte do lote que não será consumida até o vencimento.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <ShoppingCart className="size-5 text-primary" />
          <CardTitle>Comprar agora ({comprar.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {comprar.map((i) => (
            <div key={i.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{i.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.categoria} · lote {i.lote} · validade {formatData(i.validade)}
                  </p>
                </div>
                <StatusBadge tone="critical">
                  Comprar {i.sugestaoCompra} {i.unidade}
                </StatusBadge>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                <Info2 label="Em estoque" value={`${i.quantidade} ${i.unidade}`} />
                <Info2 label="Consumo mensal" value={`${i.consumoMensal} ${i.unidade}`} />
                <Info2 label="Cobertura" value={formatMeses(i.mesesRestantes)} />
                <Info2
                  label="Perda prevista"
                  value={i.perdaPrevista > 0 ? `${i.perdaPrevista} ${i.unidade}` : "nenhuma"}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <EstoqueBadge nivel={i.nivelEstoque} />
                <ValidadeBadge nivel={i.nivelValidade} dias={i.diasParaVencer} />
                {i.procedimentos.map((p) => (
                  <StatusBadge key={p} tone="neutral">
                    {p}
                  </StatusBadge>
                ))}
              </div>
            </div>
          ))}
          {comprar.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">Nenhuma reposição necessária no momento.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Estoque adequado ({ok.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {ok.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{i.nome}</span>
              <span className="text-muted-foreground">{formatMeses(i.mesesRestantes)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
