import type { WriteupMeta } from "./writeups";

export const severityClassName: Record<WriteupMeta["severity"], string> = {
  Critical: "text-accent",
  "Critical (disputed)": "text-accent",
  High: "text-foreground",
  Medium: "text-foreground/70",
  Low: "text-foreground/50",
  Informational: "text-foreground/40",
  "N/A": "text-foreground/40",
};

// Status reflects disclosure outcome, not technical severity — accent is
// reserved for a fully "Confirmed" finding; everything else stays muted.
export const statusClassName: Record<WriteupMeta["status"], string> = {
  Confirmed: "text-accent",
  Disputed: "text-foreground/50",
  "Negative (Clean Audit)": "text-foreground/50",
  Draft: "text-foreground/40",
};
