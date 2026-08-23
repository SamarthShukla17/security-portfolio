export interface Project {
  slug: string;
  name: string;
  description: string;
  stack: string[];
  liveUrl?: string;
  sourceUrl?: string;
}

// Add future tools to this array — EngineeringSection renders it as-is.
export const projects: Project[] = [
  {
    slug: "solana-agentic-fuzzing-harness",
    name: "Solana Agentic Fuzzing & Invariant Harness",
    description:
      "A standalone Rust crate built on LiteSVM, used across live bug bounty engagements. " +
      "It hand-declares instruction and account layouts from a target's committed IDL rather " +
      "than importing the target repo's own (sometimes broken) dependency tree, so a stale or " +
      "conflicting transitive dependency can never block a run. Originally built to verify a " +
      "Midas Protocol finding — 5 invariants checked across a 300-iteration randomized " +
      "adversarial run — then generalized and reused to trace Orca's Whirlpools and xORCA " +
      "programs. It's extended per-target as new engagements come up, rather than rebuilt " +
      "from scratch each time.",
    stack: ["Rust", "LiteSVM", "Solana", "Anchor", "Pinocchio"],
    sourceUrl: "/solana-agentic-fuzzing-harness.md",
  },
  {
    slug: "verifibet",
    name: "VerifiBet",
    description:
      "A Solana parimutuel prediction market for the 2026 World Cup, settled against " +
      "TxODDS's on-chain TxLINE data feed instead of a trusted oracle — resolve_market " +
      "can't mark a market resolved without a real Merkle-proof CPI into TxLINE succeeding " +
      "first, and every settlement receipt ships a client-side \"verify in your browser\" " +
      "button that recomputes the same proof. Payouts are parimutuel (stake × total_pool ÷ " +
      "winning_pool, no house edge) into escrow that's the canonical token account of each " +
      "market's own PDA, so there's no admin sweep path. Live on devnet, with keeper logic " +
      "that runs the lock → resolve → void cycle end-to-end.",
    stack: ["Rust", "Anchor", "Solana", "Next.js", "TypeScript"],
    liveUrl: "https://verifibet.vercel.app",
    sourceUrl: "https://github.com/SamarthShukla17/verifibet",
  },
  {
    slug: "staking-vault",
    name: "Staking Vault",
    description:
      "An Anchor-based SPL staking vault on Solana, with a TypeScript SDK and web app, " +
      "built around one invariant enforced at every instruction boundary: vault.amount == " +
      "pool.total_staked == Σ stake.amount. The security suite covers 9 adversarial threats " +
      "— double-claim, fake vault substitution, pool re-initialization, rounding theft, and " +
      "others — validated across 48 LiteSVM integration tests plus 10 Rust unit tests. Also " +
      "includes a second, independent implementation of the same protocol subset written " +
      "natively against Pinocchio — no_std, zero-copy, no external dependencies — to prove " +
      "the protocol logic isn't tied to Anchor. Live on devnet.",
    stack: ["Rust", "Anchor", "Pinocchio", "Solana", "TypeScript"],
    sourceUrl: "https://github.com/SamarthShukla17/Staking-Vault",
  },
  {
    slug: "solana-microstructure-note",
    name: "Price Impact on Solana: Order Book vs. AMM",
    description:
      "A short empirical research note comparing price impact on Solana's SOL/USDC market " +
      "across an order book (Phoenix) and an AMM (Raydium), isolated via Jupiter's quote API " +
      "across five trade sizes from $100 to $100,000. Finds Phoenix's impact is stepwise and " +
      "accelerates sharply past its resting top-of-book depth, while Raydium's constant-" +
      "product curve grows smoothly and near-linearly — with Raydium quoting tighter " +
      "execution at every size tested in this snapshot. Includes the raw data, fetch script, " +
      "and a SHA-256 timestamp of the writeup anchored via a Solana devnet memo transaction.",
    stack: ["TypeScript", "Solana", "Jupiter API"],
    sourceUrl: "https://github.com/SamarthShukla17/solana-microstructure-note",
  },
];
