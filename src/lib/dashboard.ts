import data from "../../content/dashboard.json";

export type DashboardSeverity = "Critical" | "High" | "Medium" | "Low";

export interface DashboardFinding {
  id: string;
  title: string;
  severity: DashboardSeverity;
  platform: string;
  program: string;
  slug: string;
}

export interface DashboardPlatform {
  name: string;
  profile: string;
  report?: string;
}

export interface UndisclosedSeverityCount {
  severity: string;
  count: number;
}

export interface PracticeEntry {
  name: string;
  kind: string;
  rank: number;
  solved: number;
  asOf: string;
  profile: string;
}

const findings = data.findings as DashboardFinding[];
const practice = data.practice as PracticeEntry[];
const undisclosed = data.confirmedUndisclosed as {
  severityKnown: UndisclosedSeverityCount[];
  severityNotDisclosed: { count: number; source: string; state: string };
};
const platforms = data.platforms as DashboardPlatform[];

const count = (s: DashboardSeverity) =>
  findings.filter((f) => f.severity === s).length;

// Everything is derived from the findings list, so the totals can never
// drift from the rows shown under them.
export const dashboard = {
  updated: data.updated,
  findings,
  platforms,
  practice,
  // Counts only, by design: no program names or details until cleared.
  confirmedUndisclosed: {
    severityKnown: undisclosed.severityKnown,
    severityNotDisclosed: undisclosed.severityNotDisclosed,
    total:
      undisclosed.severityKnown.reduce((n, r) => n + r.count, 0) +
      undisclosed.severityNotDisclosed.count,
  },
  totals: {
    findings: findings.length,
    critical: count("Critical"),
    high: count("High"),
    medium: count("Medium"),
    low: count("Low"),
    platforms: platforms.length,
  },
};
