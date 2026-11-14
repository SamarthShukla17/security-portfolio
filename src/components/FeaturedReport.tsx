import fs from "fs";
import path from "path";
import Link from "next/link";
import { getAllWriteups } from "@/lib/writeups";
import { dashboard } from "@/lib/dashboard";

// Surfaces the newest writeup that ships a PDF edition (set via `pdf:` frontmatter).
export default function FeaturedReport() {
  const report = getAllWriteups().find((w) => w.pdf);
  if (!report || !report.pdf) return null;

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  let size = "";
  try {
    const bytes = fs.statSync(path.join(process.cwd(), "public", report.pdf)).size;
    size = `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  } catch {
    // size is cosmetic; skip it if the file is missing
  }
  const t = dashboard.totals;

  return (
    <section className="max-w-3xl mx-auto px-4 py-16 border-t border-muted/20 text-sm">
      <p className="text-muted mb-6">$ ls reports/</p>
      <div className="border border-muted/20 p-4 hover:bg-muted/5">
        <p className="text-xs uppercase tracking-wide text-muted/75">audit report · pdf{size && ` · ${size}`}</p>
        <h3 className="text-foreground font-medium mt-2">{report.title}</h3>
        <p className="text-muted mt-1">
          {report.protocol} · {t.high} high · {t.medium} medium
        </p>
        <p className="mt-3 text-muted leading-relaxed">
          Full public disclosure with root causes, executed proof-of-concept evidence, and recommended fixes.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={`${base}${report.pdf}`}
            className="cta"
          >
            Download PDF
          </a>
          <Link
            href={`/writeups/${report.slug}`}
            className="cta-secondary"
          >
            Read online
          </Link>
        </div>
      </div>
    </section>
  );
}
