import Link from "next/link";
import Bio from "@/components/Bio";
import EngineeringSection from "@/components/EngineeringSection";
import DashboardSummary from "@/components/DashboardSummary";
import FeaturedReport from "@/components/FeaturedReport";
import { getAllWriteups } from "@/lib/writeups";
import WriteupRow from "@/components/WriteupRow";

export default function Home() {
  const recentWriteups = getAllWriteups().slice(0, 3);

  return (
    <main>
      <Bio />

      <FeaturedReport />

      <DashboardSummary />

      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="eyebrow">Recent writeups</h2>
          <Link href="/writeups" className="text-sm">
            View all →
          </Link>
        </div>

        {recentWriteups.length === 0 ? (
          <p className="text-muted">No writeups published yet.</p>
        ) : (
          <div className="card overflow-hidden">
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
