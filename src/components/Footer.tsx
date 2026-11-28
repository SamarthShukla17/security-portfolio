export default function Footer() {
  return (
    <footer className="border-t border-muted/15 mt-20">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted">
        <p>&copy; {new Date().getFullYear()} Samarth Shukla. All rights reserved.</p>
        <div className="flex gap-4">
          <a
            href="https://x.com/Sam39741"
            target="_blank"
            rel="noopener noreferrer">
            X / Twitter
          </a>
          <a
            href="https://github.com/SamarthShukla17"
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </a>
          <a
            href="mailto:samarthofficial52@gmail.com">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
