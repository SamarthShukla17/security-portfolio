import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const HANDLE = "samarth@security:~$";

const navLinks = [
  { label: "Writeups", href: "/writeups" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Engineering", href: "/#engineering" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-muted/20">
      <nav className="max-w-3xl mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link href="/" className="plain order-1 mr-auto">
          {HANDLE}
        </Link>
        <a
          href="mailto:samarthofficial52@gmail.com"
          className="cta cta-sm order-2 sm:order-3"
        >
          Hire for Audit
        </a>
        <div className="order-3 sm:order-2 flex gap-x-4 sm:gap-x-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="order-4 ml-auto sm:ml-0">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
