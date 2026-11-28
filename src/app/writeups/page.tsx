import type { Metadata } from "next";
import { getAllWriteups } from "@/lib/writeups";
import WriteupRow from "@/components/WriteupRow";

export const metadata: Metadata = {
  title: "Writeups | Security Portfolio",
  description: "Security research write-ups, CTF solutions, and disclosures.",
};

export default function WriteupsPage() {
  const writeups = getAllWriteups();

  return (
    <main className="max-w-3xl mx-auto px-4 pt-14 pb-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Writeups</h1>
      <p className="text-muted mt-2 mb-8">
        Method notes, engagements and audit reports.
      </p>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:grid-cols-[6rem_1fr_8rem_6.5rem] gap-x-4 px-4 py-2.5 eyebrow border-b border-muted/15">
          <span>Date</span>
          <span>Title</span>
          <span className="hidden sm:block">Protocol</span>
          <span>Severity</span>
        </div>

        {writeups.length === 0 && (
          <div className="px-4 py-6 text-muted">Nothing published yet.</div>
        )}

        {writeups.map((w) => (
          <WriteupRow key={w.slug} w={w} />
        ))}
      </div>
    </main>
  );
}
