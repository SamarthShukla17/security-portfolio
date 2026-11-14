import type { WriteupMeta } from "./writeups";

export const severityClassName: Record<WriteupMeta["severity"], string> = {
  Critical: "text-foreground font-medium",
  "Critical (disputed)": "text-foreground font-medium",
  High: "text-foreground",
  Medium: "text-muted",
  Low: "text-muted/80",
  Informational: "text-muted/75",
  "N/A": "text-muted/75",
  TBD: "text-muted italic",
};

// Status reflects disclosure outcome, not technical severity — tonal
// weight is reserved for a fully "Confirmed" finding; everything else
// recedes into muted gray rather than picking up a color.
export const statusClassName: Record<WriteupMeta["status"], string> = {
  Confirmed: "text-foreground font-medium",
  Disputed: "text-muted",
  "Negative (Clean Audit)": "text-muted",
  Draft: "text-muted/75",
  "Paused (Unverified)": "text-muted",
  Methodology: "text-foreground",
  Engagement: "text-foreground",
};
