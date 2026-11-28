import { dashboard } from "@/lib/dashboard";

// Shows CTF standings on the hero. Data comes from content/dashboard.json and only
// entries marked "featured": true are shown, so nothing renders until real numbers exist.
export default function HeroCtf() {
  const featured = dashboard.practice.filter((p) => p.featured);
  if (featured.length === 0) return null;

  return (
    <ul className="mt-7 space-y-3 list-none p-0" aria-label="CTF standings">
      {featured.map((p) => (
        <li key={p.name} className="text-sm">
          <span className="block font-medium text-foreground">
            CTF rank #{p.rank}
            {p.players ? ` of ${p.players}` : ""}
            {p.title ? ` · ${p.title}` : ""}
          </span>
          <span className="block text-muted mt-0.5">
            {p.name} · {p.solved}
            {p.total ? `/${p.total}` : ""} solved · as of {p.asOf} ·{" "}
            <a href={p.profile} target="_blank" rel="noopener noreferrer">
              profile
            </a>
          </span>
        </li>
      ))}
    </ul>
  );
}
