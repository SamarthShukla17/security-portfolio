import { Fragment } from "react";

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
    <aside className="tech-card" aria-label="Scope of work">
      {groups.map((g) => (
        <section key={g.title}>
          <h3>{g.title}</h3>
          <p>
            {g.items.map((item, i) => (
              <Fragment key={item}>
                <span className="whitespace-nowrap">
                  {item}
                  {i < g.items.length - 1 ? " ·" : ""}
                </span>{" "}
              </Fragment>
            ))}
          </p>
        </section>
      ))}
    </aside>
  );
}
