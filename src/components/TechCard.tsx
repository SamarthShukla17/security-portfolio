// Scope of work, drawn from the private research archive's engagement index
// (portfolio/engagements.csv). Category level only — no program names.
const groups: { title: string; items: string[] }[] = [
  { title: "Ecosystems", items: ["Solana", "EVM", "WASM", "Move", "Clarity"] },
  { title: "Protocols", items: ["Lending", "AMM", "Stablecoins", "Bridges", "Oracles"] },
  {
    title: "Languages & tools",
    items: ["Rust", "Anchor", "Pinocchio", "Solidity", "Foundry", "LiteSVM", "Halmos", "Echidna"],
  },
];

export default function TechCard() {
  return (
    <aside className="tech-card card" aria-label="Scope of work">
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="eyebrow">{g.title}</h3>
          <div className="chips">
            {g.items.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
