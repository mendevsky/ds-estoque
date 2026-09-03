import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClinicaBar, SemClinica } from "@/components/ClinicaBar";
import { useSessao } from "@/hooks/useSessao";
import { useDadosClinica } from "@/hooks/useDadosClinica";
import { formatData } from "@/lib/estoque";

export const Route = createFileRoute("/_authenticated/manutencao")({
  head: () => ({
    meta: [
      { title: "Manutenção do estoque: entrada e saída de insumos | MedEstoque" },
      {
        name: "description",
        content:
          "O técnico escaneia o código de barras, registra entrada ou retirada de insumos, informa lote, validade e a localização na clínica.",
      },
      { property: "og:title", content: "Manutenção do estoque: entrada e saída de insumos" },
      { property: "og:description", content: "Registro de entradas e retiradas com código de barras e localização." },
    ],
  }),
  component: Manutencao,
});

function Manutencao() {
  const { clinicaId, userId } = useSessao();
  const { itens, movimentacoes, procedimentos } = useDadosClinica(clinicaId);
  const qc = useQueryClient();

  const [codigo, setCodigo] = useState("");
  const [insumoId, setInsumoId] = useState("");
  const [tipo, setTipo] = useState("saida");
  const [quantidade, setQuantidade] = useState("1");
  const [loteId, setLoteId] = useState("");
  const [novoLote, setNovoLote] = useState("");
  const [validade, setValidade] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [procedimentoId, setProcedimentoId] = useState("");
  const [observacao, setObservacao] = useState("");

  const insumo = itens.find((i) => i.id === insumoId);

  function buscarPorCodigo(valor: string) {
    setCodigo(valor);
    const achado = itens.find((i) => (i.codigo_barras ?? "") === valor.trim());
    if (achado) {
      setInsumoId(achado.id);
      setLocalizacao(achado.localizacao);
      toast.success(`Insumo identificado: ${achado.nome}`);
    }
  }

  const registrar = useMutation({
    mutationFn: async () => {
      if (!clinicaId) throw new Error("Selecione a clínica.");
      if (!insumoId) throw new Error("Escolha o insumo.");
      const qtd = Number(quantidade);
      if (!isFinite(qtd) || qtd <= 0) throw new Error("Quantidade inválida.");

      let loteAlvo = loteId;
      if (tipo === "entrada") {
        if (loteId === "novo" || !loteId) {
          const { data, error } = await supabase
            .from("lotes")
            .insert({
              insumo_id: insumoId,
              clinica_id: clinicaId,
              lote: novoLote.trim().slice(0, 60) || "sem lote",
              validade: validade || null,
              quantidade: qtd,
            })
            .select("id")
            .single();
          if (error) throw error;
          loteAlvo = data.id;
        } else {
          const atual = insumo?.lotes.find((l) => l.id === loteId);
          const { error } = await supabase
            .from("lotes")
            .update({ quantidade: Number(atual?.quantidade ?? 0) + qtd })
            .eq("id", loteId);
          if (error) throw error;
        }
      } else {
        if (!loteId || loteId === "novo") throw new Error("Escolha o lote de saída.");
        const atual = insumo?.lotes.find((l) => l.id === loteId);
        const restante = Number(atual?.quantidade ?? 0) - qtd;
        if (restante < 0) throw new Error("Quantidade maior que o saldo do lote.");
        const { error } = await supabase.from("lotes").update({ quantidade: restante }).eq("id", loteId);
        if (error) throw error;
      }

      if (localizacao.trim()) {
        await supabase.from("insumos").update({ localizacao: localizacao.trim().slice(0, 120) }).eq("id", insumoId);
      }

      const { error: errMov } = await supabase.from("movimentacoes").insert({
        clinica_id: clinicaId,
        insumo_id: insumoId,
        lote_id: loteAlvo && loteAlvo !== "novo" ? loteAlvo : null,
        procedimento_id: procedimentoId || null,
        tipo,
        quantidade: qtd,
        localizacao: localizacao.trim().slice(0, 120),
        observacao: observacao.trim().slice(0, 300),
        user_id: userId,
      });
      if (errMov) throw errMov;
    },
    onSuccess: () => {
      toast.success("Movimentação registrada.");
      qc.invalidateQueries({ queryKey: ["insumos", clinicaId] });
      qc.invalidateQueries({ queryKey: ["movimentacoes", clinicaId] });
      setQuantidade("1");
      setObservacao("");
      setNovoLote("");
      setValidade("");
      setCodigo("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Manutenção</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entradas e retiradas de insumos com leitura do código de barras, lote, validade e localização.
        </p>
      </header>
      <ClinicaBar />

      {!clinicaId ? (
        <SemClinica />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanBarcode className="size-5 text-primary" /> Registrar movimentação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  registrar.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="codigo">Código de barras</Label>
                  <Input
                    id="codigo"
                    autoFocus
                    inputMode="numeric"
                    placeholder="Escaneie ou digite o código"
                    value={codigo}
                    onChange={(e) => buscarPorCodigo(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Insumo</Label>
                  <Select
                    value={insumoId}
                    onValueChange={(v) => {
                      setInsumoId(v);
                      setLoteId("");
                      setLocalizacao(itens.find((i) => i.id === v)?.localizacao ?? "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {itens.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saida">Retirada (uso)</SelectItem>
                        <SelectItem value="entrada">Entrada (reposição)</SelectItem>
                        <SelectItem value="ajuste">Ajuste / descarte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="qtd">Quantidade {insumo ? `(${insumo.unidade})` : ""}</Label>
                    <Input
                      id="qtd"
                      type="number"
                      min={0.01}
                      step="any"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Lote</Label>
                  <Select value={loteId} onValueChange={setLoteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o lote" />
                    </SelectTrigger>
                    <SelectContent>
                      {(insumo?.lotes ?? []).map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.lote} · {l.quantidade} · val. {formatData(l.validade)}
                        </SelectItem>
                      ))}
                      {tipo === "entrada" && <SelectItem value="novo">+ Novo lote</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                {tipo === "entrada" && loteId === "novo" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="lote">Número do lote</Label>
                      <Input id="lote" maxLength={60} value={novoLote} onChange={(e) => setNovoLote(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="val">Validade</Label>
                      <Input id="val" type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="loc">Localização na clínica</Label>
                  <Input
                    id="loc"
                    maxLength={120}
                    placeholder="Ex.: Armário A1, prateleira 2"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                  />
                </div>

                {tipo === "saida" && (
                  <div className="space-y-1.5">
                    <Label>Procedimento (opcional)</Label>
                    <Select value={procedimentoId} onValueChange={setProcedimentoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vincular a um procedimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {procedimentos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="obs">Observação</Label>
                  <Textarea id="obs" maxLength={300} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                </div>

                <Button type="submit" className="w-full" disabled={registrar.isPending}>
                  Registrar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Últimas movimentações</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Qtd.</TableHead>
                    <TableHead>Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.slice(0, 25).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>{itens.find((i) => i.id === m.insumo_id)?.nome ?? "—"}</TableCell>
                      <TableCell className="capitalize">{m.tipo}</TableCell>
                      <TableCell>{m.quantidade}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.localizacao}</TableCell>
                    </TableRow>
                  ))}
                  {movimentacoes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        Nenhuma movimentação registrada ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
