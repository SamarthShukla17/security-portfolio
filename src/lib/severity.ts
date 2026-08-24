import type { WriteupMeta } from "./writeups";

export const severityClassName: Record<WriteupMeta["severity"], string> = {
  Critical: "text-foreground font-medium",
  "Critical (disputed)": "text-foreground font-medium",
  High: "text-foreground",
  Medium: "text-muted",
  Low: "text-muted/70",
  Informational: "text-muted/50",
  "N/A": "text-muted/50",
  TBD: "text-muted/40 italic",
};

// Status reflects disclosure outcome, not technical severity — tonal
// weight is reserved for a fully "Confirmed" finding; everything else
// recedes into muted gray rather than picking up a color.
export const statusClassName: Record<WriteupMeta["status"], string> = {
  Confirmed: "text-foreground font-medium",
  Disputed: "text-muted",
  "Negative (Clean Audit)": "text-muted",
  Draft: "text-muted/60",
};
