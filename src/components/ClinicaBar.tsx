import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function useClinicas() {
  return useQuery({
    queryKey: ["clinicas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinicas").select("id, nome, cidade").order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Cabeçalho com a clínica em uso. Superusuário pode alternar entre as clínicas. */
export function ClinicaBar() {
  const { isSuperuser, clinicaId, clinicaNome, setClinicaAtiva } = useSessao();
  const { data: clinicas } = useClinicas();
  const nome = clinicas?.find((c) => c.id === clinicaId)?.nome ?? clinicaNome;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Building2 className="size-4 text-primary" />
      <span className="text-sm text-muted-foreground">Clínica:</span>
      {isSuperuser ? (
        <Select value={clinicaId ?? ""} onValueChange={(v) => setClinicaAtiva(v)}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Selecione a clínica" />
          </SelectTrigger>
          <SelectContent>
            {(clinicas ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome} — {c.cidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="font-medium">{nome || "sem clínica vinculada"}</span>
      )}
      {isSuperuser && <span className="text-xs text-muted-foreground">acesso de superusuário</span>}
    </div>
  );
}

export function SemClinica() {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
      Selecione uma clínica para visualizar os dados.
    </div>
  );
}
