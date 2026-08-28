export default function Footer() {
  return (
    <footer className="border-t border-muted/20 mt-24">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-muted/60">
        <p>&copy; {new Date().getFullYear()} Samarth Shukla. All rights reserved.</p>
        <div className="flex gap-4">
          <a
            href="https://x.com/Sam39741"
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
            href="mailto:samarthofficial52@gmail.com"
            className="hover:text-foreground hover:underline underline-offset-4"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
