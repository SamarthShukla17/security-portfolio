import Link from "next/link";
import { format } from "date-fns";
import type { WriteupMeta } from "@/lib/writeups";
import { severityClassName } from "@/lib/severity";

export default function WriteupRow({ w }: { w: WriteupMeta }) {
  const isDraft = w.status === "Draft";
  const isEngagement = w.status === "Engagement";
  return (
    <Link
      href={`/writeups/${w.slug}`}
      className={`plain grid grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:grid-cols-[6rem_1fr_8rem_6.5rem] gap-x-4 gap-y-1 items-center px-4 py-3 border-b border-muted/10 last:border-b-0 hover:bg-muted/5 ${
        isDraft ? "opacity-80" : ""
      }`}
    >
      <span className="text-muted text-[0.85rem] tabular-nums">
        {format(new Date(w.date), "yyyy-MM-dd")}
      </span>
      <span className={`truncate ${isDraft ? "text-muted italic" : "text-foreground font-medium"}`}>
        {isDraft && <span className="chip mr-2 not-italic">Draft</span>}
        {w.title}
      </span>
      <span className="text-muted truncate hidden sm:block">{w.protocol}</span>
      {isEngagement ? (
        <span className="text-muted">Engagement</span>
      ) : w.status === "Methodology" ? (
        <span className="text-muted">Methodology</span>
      ) : (
        <span className={severityClassName[w.severity]}>{w.severity}</span>
      )}
      {isEngagement && (
        <span className="col-start-2 col-span-2 sm:col-span-3 flex flex-wrap gap-1.5 pt-1">
          {[w.chain, w.scope, ...(w.highlights ?? [])]
            .filter(Boolean)
            .map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
        </span>
      )}
    </Link>
  );
}
