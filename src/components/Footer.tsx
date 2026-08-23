// PLACEHOLDER_X_HANDLE / PLACEHOLDER_CONTACT_EMAIL: swap in real links before launch.
export default function Footer() {
  return (
    <footer className="border-t border-foreground/10 mt-24">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-foreground/40">
        <p>&copy; {new Date().getFullYear()} Samarth Shukla. All rights reserved.</p>
        <div className="flex gap-4">
          <a
            href="https://x.com/PLACEHOLDER_X_HANDLE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            X / Twitter
          </a>
          <a
            href="https://github.com/SamarthShukla17"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            GitHub
          </a>
          <a
            href="mailto:PLACEHOLDER_CONTACT_EMAIL@example.com"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
