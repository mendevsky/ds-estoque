import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, PackageX } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { InsumoCalculado, NivelEstoque, NivelValidade } from "@/data/inventory";

export function EstoqueBadge({ nivel }: { nivel: NivelEstoque }) {
  if (nivel === "critico")
    return (
      <StatusBadge tone="critical">
        <PackageX className="size-3.5" /> Crítico
      </StatusBadge>
    );
  if (nivel === "atencao")
    return (
      <StatusBadge tone="warning">
        <AlertTriangle className="size-3.5" /> Atenção
      </StatusBadge>
    );
  return (
    <StatusBadge tone="success">
      <CheckCircle2 className="size-3.5" /> Adequado
    </StatusBadge>
  );
}

export function ValidadeBadge({ nivel, dias }: { nivel: NivelValidade; dias: number }) {
  if (nivel === "vencido")
    return (
      <StatusBadge tone="critical">
        <PackageX className="size-3.5" /> Vencido há {Math.abs(dias)} d
      </StatusBadge>
    );
  if (nivel === "usar-agora")
    return (
      <StatusBadge tone="critical">
        <Clock3 className="size-3.5" /> Usar imediatamente ({dias} d)
      </StatusBadge>
    );
  if (nivel === "proximo")
    return (
      <StatusBadge tone="warning">
        <CalendarClock className="size-3.5" /> Vence em {dias} d
      </StatusBadge>
    );
  return (
    <StatusBadge tone="neutral">
      <CalendarClock className="size-3.5" /> {dias} d
    </StatusBadge>
  );
}

export function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatMeses(m: number) {
  if (!isFinite(m)) return "—";
  return `${m.toFixed(1)} meses`;
}

export function CoberturaBar({ item }: { item: InsumoCalculado }) {
  const pct = Math.min(100, (item.mesesRestantes / 3) * 100);
  const tone =
    item.nivelEstoque === "critico" ? "bg-critical" : item.nivelEstoque === "atencao" ? "bg-warning" : "bg-success";
  return (
    <div className="min-w-28">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <span className="mt-1 block text-xs text-muted-foreground">{formatMeses(item.mesesRestantes)}</span>
    </div>
  );
}
