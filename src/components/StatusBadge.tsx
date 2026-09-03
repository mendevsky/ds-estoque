import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        critical: "bg-critical/12 text-critical ring-1 ring-critical/25",
        warning: "bg-warning/18 text-warning-foreground ring-1 ring-warning/40",
        success: "bg-success/12 text-success ring-1 ring-success/25",
        info: "bg-info/12 text-info ring-1 ring-info/25",
        neutral: "bg-muted text-muted-foreground ring-1 ring-border",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadge> {}

export function StatusBadge({ className, tone, ...props }: StatusBadgeProps) {
  return <span className={cn(statusBadge({ tone }), className)} {...props} />;
}
