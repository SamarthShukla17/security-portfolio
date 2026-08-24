import Link from "next/link";

const HANDLE = "samarth@security:~$";

const navLinks = [
  { label: "Writeups", href: "/writeups" },
  { label: "Engineering", href: "/#engineering" },
  { label: "Contact", href: "/#contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-muted/20">
      <nav className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between text-sm">
        <Link
          href="/"
          className="text-foreground no-underline hover:underline underline-offset-4"
        >
          {HANDLE}
        </Link>
        <div className="flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted no-underline hover:text-foreground hover:underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
