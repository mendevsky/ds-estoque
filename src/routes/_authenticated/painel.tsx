import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Clock3, PackageSearch, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClinicaBar, SemClinica } from "@/components/ClinicaBar";
import { CoberturaBar, EstoqueBadge, ValidadeBadge } from "@/components/inventory-ui";
import { useSessao } from "@/hooks/useSessao";
import { useDadosClinica } from "@/hooks/useDadosClinica";
import { formatData } from "@/lib/estoque";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel da clínica: estoque, validade e compras | MedEstoque" },
      {
        name: "description",
        content:
          "Resumo da clínica: insumos em estoque crítico, lotes vencendo, consumo mensal real e itens que devem entrar em compra.",
      },
      { property: "og:title", content: "Painel da clínica | MedEstoque" },
      { property: "og:description", content: "Estoque crítico, validades e consumo mensal da sua clínica." },
    ],
  }),
  component: Painel,
});

function Painel() {
  const { clinicaId } = useSessao();
  const { itens, carregando } = useDadosClinica(clinicaId);

  const criticos = itens.filter((i) => i.nivel === "critico");
  const vencendo = itens.filter((i) => i.diasValidade <= 30);
  const compras = itens.filter((i) => i.sugestao > 0);
  const consumoTotal = Math.round(itens.reduce((s, i) => s + i.consumoMensal, 0));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Painel da clínica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O que tenho, o que está vencendo e o que precisa entrar em processo de compra.
        </p>
      </header>
      <ClinicaBar />

      {!clinicaId ? (
        <SemClinica />
      ) : carregando ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={<PackageSearch className="size-5" />} label="Insumos cadastrados" value={itens.length} hint="na clínica" />
            <Kpi
              icon={<AlertTriangle className="size-5 text-critical" />}
              label="Estoque crítico"
              value={criticos.length}
              hint="abaixo da quantidade crítica definida"
            />
            <Kpi
              icon={<Clock3 className="size-5 text-warning-foreground" />}
              label="Usar imediatamente"
              value={vencendo.length}
              hint="lotes vencendo em até 30 dias"
            />
            <Kpi
              icon={<ShoppingCart className="size-5 text-info" />}
              label="Entrar em compra"
              value={compras.length}
              hint={`consumo total ${consumoTotal}/mês`}
            />
          </section>

          {vencendo.length > 0 && (
            <Card className="border-critical/30 bg-critical/5 shadow-card">
              <CardHeader>
                <CardTitle className="text-critical">Prioridade de uso imediato</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {vencendo.map((i) => (
                  <div key={i.id} className="rounded-xl border border-critical/20 bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{i.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Lote {i.loteCritico?.lote} · vence em {formatData(i.loteCritico?.validade ?? null)} ·{" "}
                          {i.localizacao}
                        </p>
                      </div>
                      <ValidadeBadge dias={i.diasValidade} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {i.quantidade} {i.unidade} em estoque
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Menor cobertura de estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...itens]
                .sort((a, b) => a.meses - b.meses)
                .slice(0, 6)
                .map((i) => (
                  <div key={i.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
                    <div className="min-w-48">
                      <p className="font-medium">{i.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.quantidade} {i.unidade} · consumo {Math.round(i.consumoMensal)}/mês · mínimo{" "}
                        {i.estoque_minimo}
                      </p>
                    </div>
                    <CoberturaBar meses={i.meses} nivel={i.nivel} />
                    <div className="flex items-center gap-2">
                      <EstoqueBadge nivel={i.nivel} />
                      <ValidadeBadge dias={i.diasValidade} />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Sugestão de compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {compras.length === 0 && <p className="text-sm text-muted-foreground">Nada a comprar agora.</p>}
              {compras.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="font-medium">{i.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    comprar ~{i.sugestao} {i.unidade} (cobertura de 3 meses)
                  </span>
                </div>
              ))}
              <Link to="/estoque" className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline">
                Ver estoque completo
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint: string }) {
  return (
    <Card className="shadow-card">
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
