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
    <section className="max-w-3xl mx-auto px-4 py-14">
      <h2 className="eyebrow mb-5">Featured report</h2>
      <div className="card card-hover p-6">
        <p className="text-xs text-muted">Audit report · PDF{size && ` · ${size}`}</p>
        <h3 className="text-lg sm:text-xl font-semibold tracking-tight mt-2">{report.title}</h3>
        <p className="text-muted mt-1.5">
          {report.protocol} · {t.high} high · {t.medium} medium
        </p>
        <p className="mt-4 text-muted leading-relaxed">
          Full public disclosure with root causes, executed proof-of-concept evidence, and recommended fixes.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href={`${base}${report.pdf}`} className="cta">
            Download PDF
          </a>
          <Link href={`/writeups/${report.slug}`} className="cta-secondary">
            Read online
          </Link>
        </div>
      </div>
    </section>
  );
}
