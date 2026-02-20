import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "NEON21",
  description:
    "A hyper-responsive AI-driven agent environment built for speed, clarity, and evolution.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div id="neon-grid-background" />
        <main>{children}</main>
      </body>
    </html>
  );
}
