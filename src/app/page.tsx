import Link from "next/link";
import { format } from "date-fns";
import Bio from "@/components/Bio";
import EngineeringSection from "@/components/EngineeringSection";
import { getAllWriteups } from "@/lib/writeups";
import { severityClassName } from "@/lib/severity";

export default function Home() {
  const recentWriteups = getAllWriteups().slice(0, 3);

  return (
    <main>
      <Bio />

      <section className="max-w-3xl mx-auto px-4 py-16 border-t border-muted/20 text-sm">
        <div className="flex items-baseline justify-between mb-6">
          <p className="text-muted">$ ls writeups/ | head -3</p>
          <Link href="/writeups" className="text-muted hover:text-foreground hover:underline underline-offset-4">
            view all →
          </Link>
        </div>

        {recentWriteups.length === 0 ? (
          <p className="text-muted/60">-- no writeups published yet --</p>
        ) : (
          <div className="border border-muted/20">
            {recentWriteups.map((w) => {
              const isDraft = w.status === "Draft";
              return (
                <Link
                  key={w.slug}
                  href={`/writeups/${w.slug}`}
                  className={`grid grid-cols-[6rem_1fr_7rem_6rem] gap-4 items-center px-3 py-2 border-b border-muted/10 last:border-b-0 hover:bg-muted/5 ${
                    isDraft ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-muted">
                    {format(new Date(w.date), "yyyy-MM-dd")}
                  </span>
                  <span className={`truncate ${isDraft ? "text-muted italic" : "text-foreground"}`}>
                    {isDraft && "[DRAFT] "}
                    {w.title}
                  </span>
                  <span className="text-muted truncate">{w.protocol}</span>
                  <span className={severityClassName[w.severity]}>{w.severity}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <EngineeringSection />
    </main>
  );
}
