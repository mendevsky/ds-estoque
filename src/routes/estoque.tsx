import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calcularInsumos } from "@/data/inventory";
import { CoberturaBar, EstoqueBadge, ValidadeBadge, formatData } from "@/components/inventory-ui";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque de insumos: quantidade e validade | MedEstoque" },
      {
        name: "description",
        content:
          "Lista completa de insumos médicos com quantidade, lote, validade, consumo mensal e cobertura de estoque em meses.",
      },
      { property: "og:title", content: "Estoque de insumos: quantidade e validade" },
      { property: "og:description", content: "Quantidade, lote, validade e cobertura de cada insumo médico." },
    ],
  }),
  component: EstoquePage,
});

type Filtro = "todos" | "criticos" | "validade";

function EstoquePage() {
  const itens = useMemo(() => calcularInsumos(), []);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const lista = itens
    .filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase()) || i.categoria.toLowerCase().includes(busca.toLowerCase()))
    .filter((i) =>
      filtro === "criticos"
        ? i.nivelEstoque !== "ok"
        : filtro === "validade"
          ? i.nivelValidade !== "ok"
          : true,
    )
    .sort((a, b) => a.mesesRestantes - b.mesesRestantes);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Estoque de insumos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quantidades, lotes e validades com sinalização automática do que está acabando ou vencendo.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar insumo ou categoria"
            className="pl-9"
          />
        </div>
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="criticos">Estoque baixo</TabsTrigger>
            <TabsTrigger value="validade">Validade</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="shadow-card">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>Consumo/mês</TableHead>
                <TableHead>Cobertura</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <p className="font-medium">{i.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.categoria} · lote {i.lote}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-semibold">{i.quantidade}</span>{" "}
                    <span className="text-xs text-muted-foreground">{i.unidade}</span>
                    <p className="text-xs text-muted-foreground">mín. {i.estoqueMinimo}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{i.consumoMensal}</TableCell>
                  <TableCell>
                    <CoberturaBar item={i} />
                  </TableCell>
                  <TableCell className="space-y-1">
                    <p className="text-sm">{formatData(i.validade)}</p>
                    <ValidadeBadge nivel={i.nivelValidade} dias={i.diasParaVencer} />
                  </TableCell>
                  <TableCell>
                    <EstoqueBadge nivel={i.nivelEstoque} />
                  </TableCell>
                </TableRow>
              ))}
              {lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum insumo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
