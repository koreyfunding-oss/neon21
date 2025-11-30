import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEON21",
  description: "A hyper-responsive AI-driven agent environment built for speed, clarity, and evolution.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div id="neon-grid-background"></div>
        <main>{children}</main>
      </body>
    </html>
  );
}
// app/app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "NEON21",
  description: "Next.js project powered by Vercel",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
