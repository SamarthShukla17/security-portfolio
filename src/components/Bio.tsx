import TechCard from "./TechCard";
import HeroCtf from "./HeroCtf";

export default function Bio() {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-20 pb-16">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
        <div className="min-w-0">
        <p className="text-muted mb-4">$ whoami</p>

        <h1 className="text-xl sm:text-2xl text-foreground mb-4 text-balance font-normal">
          Smart-contract security researcher.
        </h1>
        <p className="text-muted max-w-md leading-relaxed">
          I model where the money moves, break the invariants that protect it,
          and prove every finding with a working PoC.
        </p>

        <HeroCtf />

        <div id="contact" className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm">
          <a
            href="https://github.com/SamarthShukla17"
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </a>
          <a
            href="https://github.com/SamarthShukla17/web3-security-research"
            target="_blank"
            rel="noopener noreferrer">
            Research log
          </a>
          <a
            href="https://x.com/Sam39741"
            target="_blank"
            rel="noopener noreferrer">
            X / Twitter
          </a>
          <a
            href="mailto:samarthofficial52@gmail.com">
            Contact
          </a>
        </div>
        </div>
        <TechCard />
      </div>
    </section>
  );
}
