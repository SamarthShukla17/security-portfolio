import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Writeups", href: "/writeups" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Engineering", href: "/#engineering" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-muted/15">
      <nav className="max-w-3xl mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href="/" className="plain order-1 mr-auto font-semibold tracking-tight">
          Samarth Shukla
        </Link>
        <div className="order-3 sm:order-2 flex gap-x-5 sm:gap-x-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </div>
        <a
          href="https://t.me/Samarth0117"
          target="_blank"
          rel="noopener noreferrer"
          className="cta cta-sm order-2 sm:order-3"
        >
          Hire for audit
        </a>
        <div className="order-4">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
