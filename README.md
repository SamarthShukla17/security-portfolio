# Security Portfolio

Live site: **[samarthshukla17.github.io/security-portfolio](https://samarthshukla17.github.io/security-portfolio/)**

Independent Solana/Rust security research — audit trails and disclosure writeups, published as they clear for public release.

## Start Here

- **[Methodology](/writeups/methodology)** — the method (scope-gate → invariants → six bug-pattern classes × seven attack angles → falsification-first → PoC-or-it's-a-note), the toolkit, and a category-level summary of engagement work across Solana/Rust DeFi, Substrate cross-chain bridges, EVM account-abstraction, and NEAR/Wasm contracts.
- **[Writeups](/writeups)** — per-target audit trails, published only once a finding is either confirmed/disputed with the program or the underlying protocol has cleared for public disclosure. Nothing here names a target still under an active, undisclosed bounty engagement.

## About This Repo

This is the source for the portfolio site itself — a Next.js static export, deployed to both Vercel and GitHub Pages. Writeups are a file-based CMS: every entry in [`writeups/`](writeups/) is a Markdown file with YAML frontmatter (`title`, `date`, `protocol`, `severity`, `status`, `summary`), rendered through [`app/writeups/`](src/app/writeups/) and indexed by [`lib/writeups.ts`](src/lib/writeups.ts).

### Development

```bash
npm install
npm run dev      # local dev server, served at /
npm run build    # static export to out/ (basePath applies only under GITHUB_ACTIONS=true)
npm run lint
```

See [`next.config.mjs`](next.config.mjs) for the dual-deployment basePath logic and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for the GitHub Pages build.
