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
      className={`grid grid-cols-[6rem_1fr_7rem_6rem] gap-x-4 gap-y-1 items-center px-3 py-2 border-b border-muted/10 last:border-b-0 hover:bg-muted/5 ${
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
      {isEngagement ? (
        <span className="text-muted/50">engagement</span>
      ) : (
        <span className={severityClassName[w.severity]}>{w.severity}</span>
      )}
      {isEngagement && (
        <span className="col-start-2 col-span-3 text-xs text-muted/60">
          {[w.chain, w.scope, ...(w.highlights ?? [])]
            .filter(Boolean)
            .map((item) => `[${item}]`)
            .join(" ")}
        </span>
      )}
    </Link>
  );
}
