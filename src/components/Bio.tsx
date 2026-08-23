// PLACEHOLDER_X_HANDLE / PLACEHOLDER_CONTACT_EMAIL: swap in real links before launch.
export default function Bio() {
  return (
    <section className="max-w-3xl mx-auto px-4 pt-20 pb-16">
      <p className="text-foreground/50 mb-4">$ whoami</p>

      <h1 className="text-xl sm:text-2xl text-foreground mb-3 text-balance">
        Solana security researcher — Rust, Anchor & Pinocchio internals.
        Currently hunting on Immunefi and Sherlock.
        <span className="cursor-blink" aria-hidden="true">
          _
        </span>
      </h1>

      <div id="contact" className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm">
        <a
          href="https://github.com/SamarthShukla17"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-4"
        >
          GitHub
        </a>
        <a
          href="https://x.com/PLACEHOLDER_X_HANDLE"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-4"
        >
          X / Twitter
        </a>
        <a
          href="mailto:PLACEHOLDER_CONTACT_EMAIL@example.com"
          className="hover:underline underline-offset-4"
        >
          Contact
        </a>
      </div>
    </section>
  );
}
