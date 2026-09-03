import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Clock3, PackageSearch, ShoppingCart, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calcularInsumos, procedimentos } from "@/data/inventory";
import { CoberturaBar, EstoqueBadge, ValidadeBadge, formatData } from "@/components/inventory-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Estoque de Insumos Médicos | MedEstoque" },
      {
        name: "description",
        content:
          "Acompanhe quantidade, validade, consumo mensal e alertas de compra dos insumos médicos da sua clínica em um único painel.",
      },
      { property: "og:title", content: "Painel de Estoque de Insumos Médicos | MedEstoque" },
      {
        property: "og:description",
        content: "Quantidade, validade, consumo mensal e sinalização automática de compras.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const itens = calcularInsumos();
  const criticos = itens.filter((i) => i.nivelEstoque === "critico");
  const usarAgora = itens.filter((i) => i.nivelValidade === "usar-agora" || i.nivelValidade === "vencido");
  const compras = itens.filter((i) => i.precisaComprar);
  const consumoTotal = itens.reduce((s, i) => s + i.consumoMensal, 0);

  const destaques = [...itens]
    .sort((a, b) => a.mesesRestantes - b.mesesRestantes)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-primary p-8 text-primary-foreground shadow-card">
        <p className="text-sm font-medium opacity-80">Visão geral da clínica</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Controle de estoque e insumos médicos</h1>
        <p className="mt-3 max-w-2xl text-sm opacity-90">
          Quantidades, validades, consumo mensal por procedimento e sinalização automática do que precisa entrar em
          processo de compras.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/estoque">Ver estoque completo</Link>
          </Button>
          <Button asChild variant="outline" className="border-primary-foreground/30 bg-transparent hover:bg-primary-foreground/10">
            <Link to="/compras">Lista de compras</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<PackageSearch className="size-5" />}
          label="Itens cadastrados"
          value={String(itens.length)}
          hint={`${procedimentos.length} procedimentos mapeados`}
        />
        <KpiCard
          icon={<AlertTriangle className="size-5 text-critical" />}
          label="Estoque crítico"
          value={String(criticos.length)}
          hint="Cobertura abaixo de 3 semanas"
          tone="critical"
        />
        <KpiCard
          icon={<Clock3 className="size-5 text-warning-foreground" />}
          label="Usar imediatamente"
          value={String(usarAgora.length)}
          hint="Vencem em até 30 dias"
          tone="warning"
        />
        <KpiCard
          icon={<ShoppingCart className="size-5 text-info" />}
          label="Em processo de compra"
          value={String(compras.length)}
          hint={`Consumo total: ${consumoTotal} un/mês`}
          tone="info"
        />
      </section>

      {usarAgora.length > 0 && (
        <Card className="border-critical/30 bg-critical/5 shadow-card">
          <CardHeader className="flex flex-row items-center gap-2">
            <Clock3 className="size-5 text-critical" />
            <CardTitle className="text-critical">Prioridade de uso imediato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {usarAgora.map((i) => (
              <div key={i.id} className="rounded-xl border border-critical/20 bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{i.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Lote {i.lote} · vence em {formatData(i.validade)}
                    </p>
                  </div>
                  <ValidadeBadge nivel={i.nivelValidade} dias={i.diasParaVencer} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {i.quantidade} {i.unidade} em estoque ·{" "}
                  {i.perdaPrevista > 0 ? (
                    <span className="font-medium text-critical">
                      risco de perder {i.perdaPrevista} {i.unidade}
                    </span>
                  ) : (
                    <span className="text-success">consumo cobre o lote antes do vencimento</span>
                  )}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingDown className="size-5 text-primary" />
          <CardTitle>Menor cobertura de estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {destaques.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
              <div className="min-w-48">
                <p className="font-medium">{i.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {i.quantidade} {i.unidade} · consumo {i.consumoMensal}/mês
                </p>
              </div>
              <CoberturaBar item={i} />
              <div className="flex items-center gap-2">
                <EstoqueBadge nivel={i.nivelEstoque} />
                <ValidadeBadge nivel={i.nivelValidade} dias={i.diasParaVencer} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center gap-2">
          <Activity className="size-5 text-primary" />
          <CardTitle>Procedimentos do mês</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {procedimentos.map((p) => (
            <Link
              key={p.id}
              to="/procedimentos"
              className="rounded-xl border p-4 transition-colors hover:border-primary hover:bg-accent/40"
            >
              <p className="font-semibold">{p.nome}</p>
              <p className="text-sm text-muted-foreground">{p.porMes} por mês</p>
              <p className="mt-2 text-xs text-muted-foreground">{p.itens.length} insumos necessários</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "critical" | "warning" | "info";
}) {
  const ring =
    tone === "critical"
      ? "border-critical/30"
      : tone === "warning"
        ? "border-warning/40"
        : tone === "info"
          ? "border-info/30"
          : "border-border";
  return (
    <Card className={`shadow-card ${ring}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="mt-2 font-display text-3xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
