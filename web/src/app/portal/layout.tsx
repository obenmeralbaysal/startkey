import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./portal.css";
import "@/styles/watermark-badge.css";

export const metadata: Metadata = {
  title: "Giriş - StartKey Emlak Sistemi",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f5f5f7" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="glass-page">{children}</body>
    </html>
  );
}
