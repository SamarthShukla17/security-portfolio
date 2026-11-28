import type { Metadata } from "next";
import Link from "next/link";
import { dashboard } from "@/lib/dashboard";
import { severityClassName } from "@/lib/severity";

export const metadata: Metadata = {
  title: "Dashboard | Security Portfolio",
  description: "Findings published with the program's permission.",
};

export default function DashboardPage() {
  const { totals, findings, platforms, practice, updated, confirmedUndisclosed: cu } = dashboard;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const stats: [number, string][] = [
    [totals.findings, "disclosed findings"],
    [totals.high, "high"],
    [totals.medium, "medium"],
    [totals.platforms, totals.platforms === 1 ? "platform" : "platforms"],
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 pt-14 pb-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted mt-2 mb-8">Updated {updated}</p>

      <div className="card grid grid-cols-2 sm:grid-cols-4 overflow-hidden">
        {stats.map(([n, label]) => (
          <div key={label} className="px-5 py-5 border-b sm:border-b-0 border-r border-muted/15 last:border-r-0">
            <p className="text-3xl font-semibold tracking-tight">{n}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="eyebrow mt-12 mb-4">Findings</h2>
      <div className="card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] gap-4 px-4 py-2.5 eyebrow border-b border-muted/15">
          <span>ID</span>
          <span>Title</span>
          <span>Severity</span>
        </div>
        {findings.map((f) => (
          <Link
            key={f.id}
            href={`/writeups/${f.slug}`}
            className="plain grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] gap-x-4 gap-y-1 items-baseline px-4 py-3 border-b border-muted/10 last:border-b-0 hover:bg-muted/5"
          >
            <span className="text-muted order-1">{f.id}</span>
            <span className="text-foreground order-3 col-span-2 sm:col-span-1 sm:order-2 break-words">{f.title}</span>
            <span className={`${severityClassName[f.severity]} order-2 sm:order-3`}>{f.severity}</span>
          </Link>
        ))}
      </div>

      <h2 className="eyebrow mt-12 mb-1">Confirmed, not yet disclosed</h2>
      <p className="text-sm text-muted mb-4">Counts only.</p>

      <p className="text-sm text-muted mb-2">Severity confirmed</p>
      <div
        className="card grid overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${cu.severityKnown.length}, minmax(0, 1fr))` }}
      >
        {cu.severityKnown.map((r) => (
          <div key={r.severity} className="px-5 py-5 border-r border-muted/15 last:border-r-0">
            <p className="text-3xl font-semibold tracking-tight">{r.count}</p>
            <p className="text-xs text-muted mt-1">{r.severity.toLowerCase()}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted leading-relaxed">
        No programs or details are published until cleared. Severities are as
        confirmed so far and can change until final judging.
      </p>

      <h2 className="eyebrow mt-12 mb-4">Platforms</h2>
      <ul className="space-y-3">
        {platforms.map((p) => {
          const mine = findings.filter((f) => f.platform === p.name);
          const programs = [...new Set(mine.map((f) => f.program))];
          return (
            <li key={p.name} className="card px-5 py-4">
              <p className="font-semibold tracking-tight">{p.name}</p>
              <p className="text-muted mt-1">
                {mine.length === 0
                  ? "No disclosed findings yet"
                  : `${mine.length} findings · ${programs.join(", ")}`}
              </p>
              <a
                href={p.profile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2"
              >
                Public profile ↗
              </a>
              {p.report && (
                <a
                  href={`${base}${p.report}`}
                  className="inline-block mt-2 ml-4"
                >
                  Full report (PDF)
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <h2 className="eyebrow mt-12 mb-4">Practice</h2>
      <ul className="space-y-3">
        {practice.map((e) => (
          <li key={e.name} className="card px-5 py-4">
            <p className="font-semibold tracking-tight">{e.name}</p>
            <p className="text-muted mt-1">
              {e.kind} · rank #{e.rank}{e.players ? ` of ${e.players}` : ""}{e.title ? ` (${e.title})` : ""} · {e.solved}{e.total ? `/${e.total}` : ""} solved
            </p>
            <p className="text-xs text-muted mt-1">As of {e.asOf}; rank changes as the board moves</p>
            <a
              href={e.profile}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2"
            >
              Public profile ↗
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-xs text-muted leading-relaxed">
        The disclosed findings above are the ones published with the program&apos;s
        permission. Their severity is as rated by the platform&apos;s triage, not self-assessed.
      </p>
    </main>
  );
}
