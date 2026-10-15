import Link from "next/link";
import Bio from "@/components/Bio";
import EngineeringSection from "@/components/EngineeringSection";
import { getAllWriteups } from "@/lib/writeups";
import WriteupRow from "@/components/WriteupRow";

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
            {recentWriteups.map((w) => (
              <WriteupRow key={w.slug} w={w} />
            ))}
          </div>
        )}
      </section>

      <EngineeringSection />
    </main>
  );
}
