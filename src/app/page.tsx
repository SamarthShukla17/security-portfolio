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
      <EngineeringSection />

      <section className="max-w-3xl mx-auto px-4 py-16 border-t border-foreground/10 text-sm">
        <div className="flex items-baseline justify-between mb-6">
          <p className="text-foreground/50">$ ls writeups/ | head -3</p>
          <Link href="/writeups" className="hover:underline underline-offset-4">
            view all →
          </Link>
        </div>

        {recentWriteups.length === 0 ? (
          <p className="text-foreground/40">-- no writeups published yet --</p>
        ) : (
          <div className="border border-foreground/10">
            {recentWriteups.map((w) => (
              <Link
                key={w.slug}
                href={`/writeups/${w.slug}`}
                className="group grid grid-cols-[6rem_1fr_7rem_6rem] gap-4 items-center px-3 py-2 border-b border-foreground/5 last:border-b-0 hover:bg-foreground/5"
              >
                <span className="text-foreground/50">
                  {format(new Date(w.date), "yyyy-MM-dd")}
                </span>
                <span className="truncate">
                  <span className="inline-block w-3 text-accent opacity-0 group-hover:opacity-100">
                    &gt;
                  </span>
                  {w.title}
                </span>
                <span className="text-foreground/50 truncate">{w.protocol}</span>
                <span className={severityClassName[w.severity]}>{w.severity}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
