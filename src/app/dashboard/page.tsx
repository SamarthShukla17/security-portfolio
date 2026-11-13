import type { Metadata } from "next";
import Link from "next/link";
import { dashboard } from "@/lib/dashboard";
import { severityClassName } from "@/lib/severity";

export const metadata: Metadata = {
  title: "Dashboard | Security Portfolio",
  description: "Findings published with the program's permission.",
};

export default function DashboardPage() {
  const { totals, findings, platforms, updated } = dashboard;
  const stats: [number, string][] = [
    [totals.findings, "findings"],
    [totals.high, "high"],
    [totals.medium, "medium"],
    [totals.platforms, totals.platforms === 1 ? "platform" : "platforms"],
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-sm">
      <p className="text-muted mb-1">$ cat dashboard</p>
      <p className="text-xs text-muted/60 mb-6">updated {updated}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 border border-muted/20">
        {stats.map(([n, label]) => (
          <div key={label} className="px-4 py-4 border-b sm:border-b-0 border-r border-muted/20 last:border-r-0">
            <p className="text-2xl text-foreground">{n}</p>
            <p className="text-xs text-muted/70 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-muted mt-12 mb-4">$ ls findings/</p>
      <div className="border border-muted/20">
        <div className="hidden sm:grid grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] gap-4 px-3 py-2 text-xs uppercase tracking-wide text-muted/60 border-b border-muted/20">
          <span>id</span>
          <span>title</span>
          <span>severity</span>
        </div>
        {findings.map((f) => (
          <Link
            key={f.id}
            href={`/writeups/${f.slug}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] gap-x-4 gap-y-1 items-baseline px-3 py-2 border-b border-muted/10 last:border-b-0 hover:bg-muted/5"
          >
            <span className="text-muted order-1">{f.id}</span>
            <span className="text-foreground order-3 col-span-2 sm:col-span-1 sm:order-2 break-words">{f.title}</span>
            <span className={`${severityClassName[f.severity]} order-2 sm:order-3`}>{f.severity}</span>
          </Link>
        ))}
      </div>

      <p className="text-muted mt-12 mb-4">$ ls platforms/</p>
      <ul className="space-y-3">
        {platforms.map((p) => {
          const mine = findings.filter((f) => f.platform === p.name);
          const programs = [...new Set(mine.map((f) => f.program))];
          return (
            <li key={p.name} className="border border-muted/20 px-4 py-3">
              <p className="text-foreground font-medium">{p.name}</p>
              <p className="text-muted mt-1">
                {mine.length} findings · {programs.join(", ")}
              </p>
              <a
                href={p.profile}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-muted hover:text-foreground hover:underline underline-offset-4"
              >
                → public profile
              </a>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-xs text-muted/60 leading-relaxed">
        Only findings published with the program&apos;s permission are counted.
        Severity is as rated by the platform&apos;s triage, not self-assessed.
      </p>
    </main>
  );
}
