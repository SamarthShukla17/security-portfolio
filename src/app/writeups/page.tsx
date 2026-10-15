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
    <main className="max-w-3xl mx-auto px-4 py-12 text-sm">
      <p className="text-muted mb-6">$ ls writeups/</p>

      <div className="border border-muted/20">
        <div className="grid grid-cols-[6rem_1fr_7rem_6rem] gap-4 px-3 py-2 text-xs uppercase tracking-wide text-muted/60 border-b border-muted/20">
          <span>date</span>
          <span>title</span>
          <span>protocol</span>
          <span>severity</span>
        </div>

        {writeups.length === 0 && (
          <div className="px-3 py-6 text-muted/60">-- empty --</div>
        )}

        {writeups.map((w) => (
          <WriteupRow key={w.slug} w={w} />
        ))}
      </div>
    </main>
  );
}
