import Link from "next/link";
import { dashboard } from "@/lib/dashboard";

export default function DashboardSummary() {
  const t = dashboard.totals;
  const stats: [number, string][] = [
    [t.findings, "findings"],
    [t.high, "high"],
    [t.medium, "medium"],
  ];
  return (
    <section className="max-w-3xl mx-auto px-4 py-16 border-t border-muted/20 text-sm">
      <div className="flex items-baseline justify-between mb-6">
        <p className="text-muted">$ cat dashboard</p>
        <Link href="/dashboard" className="text-muted hover:text-foreground hover:underline underline-offset-4">
          full dashboard →
        </Link>
      </div>
      <div className="grid grid-cols-3 border border-muted/20">
        {stats.map(([n, label]) => (
          <div key={label} className="px-4 py-4 border-r border-muted/20 last:border-r-0">
            <p className="text-2xl text-foreground">{n}</p>
            <p className="text-xs text-muted/70 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted/60">
        Published with the program&apos;s permission. Source: HackenProof.
      </p>
    </section>
  );
}
