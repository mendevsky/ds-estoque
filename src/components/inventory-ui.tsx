import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, PackageX } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMeses, nivelValidade, type NivelEstoque } from "@/lib/estoque";

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

export function ValidadeBadge({ dias }: { dias: number }) {
  const nivel = nivelValidade(dias);
  if (!isFinite(dias))
    return (
      <StatusBadge tone="neutral">
        <CalendarClock className="size-3.5" /> sem validade
      </StatusBadge>
    );
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

export function CoberturaBar({ meses, nivel }: { meses: number; nivel: NivelEstoque }) {
  const pct = Math.min(100, (Math.min(meses, 6) / 3) * 100);
  const tone = nivel === "critico" ? "bg-critical" : nivel === "atencao" ? "bg-warning" : "bg-success";
  return (
    <div className="min-w-28">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <span className="mt-1 block text-xs text-muted-foreground">{formatMeses(meses)}</span>
    </div>
  );
}
