import type { Metadata } from "next";
import { IBM_Plex_Mono, JetBrains_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Applies the saved theme before first paint so there is no light/dark flash.
const themeScript = `(function(){var d=document.documentElement;var t="light";try{t=localStorage.getItem("theme")==="dark"?"dark":"light"}catch(e){}d.setAttribute("data-theme",t)})()`;

export const metadata: Metadata = {
  title: "Security Portfolio",
  description:
    "Security research write-ups, CTF solutions, and bug bounty findings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      style={
        {
          "--temple-url": `url(${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/temple-bg.jpg)`,
          "--edge-url": `url(${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/images/temple-edge.jpg)`,
        } as React.CSSProperties
      }
      suppressHydrationWarning
      className={`${plexMono.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {/* Turns the sketch's "darker than paper" into alpha so only the ink
            remains, tinted per theme — the page background shows through. */}
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
          <filter id="ink-light" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.110  0 0 0 0 0.098  0 0 0 0 0.090  -0.680 -2.289 -0.231 0 2.912"
            result="ink"
            />
            <feComposite in="ink" in2="SourceGraphic" operator="in" />
          </filter>
          <filter id="ink-dark" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.906  0 0 0 0 0.898  0 0 0 0 0.894  -0.680 -2.289 -0.231 0 2.912"
            result="ink"
            />
            <feComposite in="ink" in2="SourceGraphic" operator="in" />
          </filter>
        </svg>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
