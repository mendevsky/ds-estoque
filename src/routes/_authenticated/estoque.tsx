import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClinicaBar, SemClinica } from "@/components/ClinicaBar";
import { CoberturaBar, EstoqueBadge, ValidadeBadge } from "@/components/inventory-ui";
import { useSessao } from "@/hooks/useSessao";
import { useDadosClinica, type InsumoCalculado } from "@/hooks/useDadosClinica";
import { diasParaVencer, formatData } from "@/lib/estoque";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "O que tenho: estoque, lotes e validades | MedEstoque" },
      {
        name: "description",
        content:
          "Quantidade em estoque por insumo e por lote, validade, localização e quantidade crítica personalizável por clínica.",
      },
      { property: "og:title", content: "O que tenho: estoque, lotes e validades" },
      { property: "og:description", content: "Quantidade, lote, validade, localização e limite crítico por clínica." },
    ],
  }),
  component: EstoquePage,
});

type Filtro = "todos" | "criticos" | "validade";

function EstoquePage() {
  const { clinicaId } = useSessao();
  const { itens, carregando } = useDadosClinica(clinicaId);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const lista = itens
    .filter(
      (i) =>
        i.nome.toLowerCase().includes(busca.toLowerCase()) ||
        i.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        (i.codigo_barras ?? "").includes(busca),
    )
    .filter((i) => (filtro === "criticos" ? i.nivel !== "ok" : filtro === "validade" ? i.diasValidade <= 90 : true))
    .sort((a, b) => a.meses - b.meses);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">O que tenho</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quantidades por lote, validade, localização e limite crítico definido pela clínica.
        </p>
      </header>
      <ClinicaBar />

      {!clinicaId ? (
        <SemClinica />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar insumo, categoria ou código de barras"
                className="pl-9"
              />
            </div>
            <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="criticos">Quantidade baixa</TabsTrigger>
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
                    <TableHead>Lotes e validades</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <p className="font-medium">{i.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {i.categoria} · {i.localizacao || "sem local"}
                          {i.codigo_barras ? ` · ${i.codigo_barras}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="font-semibold">{i.quantidade}</span>{" "}
                        <span className="text-xs text-muted-foreground">{i.unidade}</span>
                        <p className="text-xs text-muted-foreground">crítico ≤ {i.estoque_minimo}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{Math.round(i.consumoMensal)}</TableCell>
                      <TableCell>
                        <CoberturaBar meses={i.meses} nivel={i.nivel} />
                      </TableCell>
                      <TableCell className="space-y-1">
                        {(i.lotes ?? [])
                          .filter((l) => Number(l.quantidade) > 0)
                          .sort((a, b) => String(a.validade).localeCompare(String(b.validade)))
                          .map((l) => (
                            <div key={l.id} className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {l.lote} · {l.quantidade} {i.unidade} · {formatData(l.validade)}
                              </span>
                              <ValidadeBadge dias={diasParaVencer(l.validade)} />
                            </div>
                          ))}
                      </TableCell>
                      <TableCell>
                        <EstoqueBadge nivel={i.nivel} />
                      </TableCell>
                      <TableCell>
                        <EditarLimite item={i} clinicaId={clinicaId} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!carregando && lista.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        Nenhum insumo encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function EditarLimite({ item, clinicaId }: { item: InsumoCalculado; clinicaId: string }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [minimo, setMinimo] = useState(String(item.estoque_minimo));
  const [local, setLocal] = useState(item.localizacao);

  const salvar = useMutation({
    mutationFn: async () => {
      const valor = Number(minimo);
      if (!isFinite(valor) || valor < 0) throw new Error("Quantidade crítica inválida");
      const { error } = await supabase
        .from("insumos")
        .update({ estoque_minimo: valor, localizacao: local.slice(0, 120) })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuração atualizada.");
      qc.invalidateQueries({ queryKey: ["insumos", clinicaId] });
      setAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Configurar ${item.nome}`}>
          <Settings2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="min">Quantidade crítica ({item.unidade})</Label>
            <Input id="min" type="number" min={0} value={minimo} onChange={(e) => setMinimo(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Cada clínica define o próprio limite: abaixo dele o insumo é sinalizado.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc">Localização</Label>
            <Input id="loc" maxLength={120} value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="w-full">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
