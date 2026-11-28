import TechCard from "./TechCard";
import HeroCtf from "./HeroCtf";
import { dashboard } from "@/lib/dashboard";

export default function Bio() {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-20 sm:pt-28 pb-16">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
        <div className="min-w-0">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08] text-balance">
            Smart-contract security researcher.
          </h1>
          <p className="text-muted max-w-md leading-relaxed mt-5 text-base sm:text-[1.05rem]">
            I model where the money moves, break the invariants that protect it,
            and prove every finding with a working PoC.
          </p>

          <HeroCtf />

          <div id="contact" className="flex flex-wrap gap-2 mt-8">
            <a
              href="https://github.com/SamarthShukla17"
              className="pill"
              target="_blank"
              rel="noopener noreferrer">
              GitHub
            </a>
            <a
              href="https://github.com/SamarthShukla17/web3-security-research"
              className="pill"
              target="_blank"
              rel="noopener noreferrer">
              Research log
            </a>
            {/* One link per bounty platform listed in content/dashboard.json. */}
            {dashboard.platforms.map((p) => (
              <a key={p.name} href={p.profile} className="pill" target="_blank" rel="noopener noreferrer">
                {p.name}
              </a>
            ))}
            <a
              href="https://x.com/Sam39741"
              className="pill"
              target="_blank"
              rel="noopener noreferrer">
              X / Twitter
            </a>
            <a href="mailto:samarthofficial52@gmail.com" className="pill">
              Contact
            </a>
          </div>
        </div>
        <TechCard />
      </div>
    </section>
  );
}
