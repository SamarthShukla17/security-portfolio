// GitHub Actions sets GITHUB_ACTIONS=true on every run; Vercel's build
// environment never does. NODE_ENV alone can't gate this, since Vercel
// also builds with NODE_ENV=production — that would leak the GitHub
// Pages basePath into the Vercel deployment, which is served at the
// root/a custom domain, not under /security-portfolio.
const isGithubPages = process.env.GITHUB_ACTIONS === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: isGithubPages ? "/security-portfolio" : "",
  assetPrefix: isGithubPages ? "/security-portfolio/" : "",
  env: {
    // Lets raw <a> links to files in public/ pick up the GitHub Pages basePath.
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? "/security-portfolio" : "",
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
