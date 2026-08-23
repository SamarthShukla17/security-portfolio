import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { getAllWriteups } from "@/lib/writeups";
import { severityClassName } from "@/lib/severity";

export const metadata: Metadata = {
  title: "Writeups | Security Portfolio",
  description: "Security research write-ups, CTF solutions, and disclosures.",
};

export default function WriteupsPage() {
  const writeups = getAllWriteups();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-sm">
      <p className="text-foreground/50 mb-6">$ ls writeups/</p>

      <div className="border border-foreground/10">
        <div className="grid grid-cols-[6rem_1fr_7rem_6rem] gap-4 px-3 py-2 text-xs uppercase tracking-wide text-foreground/40 border-b border-foreground/10">
          <span>date</span>
          <span>title</span>
          <span>protocol</span>
          <span>severity</span>
        </div>

        {writeups.length === 0 && (
          <div className="px-3 py-6 text-foreground/40">-- empty --</div>
        )}

        {writeups.map((w) => (
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
    </main>
  );
}
