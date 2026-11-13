import Link from "next/link";

const HANDLE = "samarth@security:~$";

const navLinks = [
  { label: "Writeups", href: "/writeups" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Engineering", href: "/#engineering" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-muted/20">
      <nav className="max-w-3xl mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <Link
          href="/"
          className="text-foreground no-underline hover:underline underline-offset-4"
        >
          {HANDLE}
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted no-underline hover:text-foreground hover:underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="mailto:samarthofficial52@gmail.com"
            className="text-foreground no-underline hover:underline underline-offset-4"
          >
            Hire for Audit
          </a>
        </div>
      </nav>
    </header>
  );
}
