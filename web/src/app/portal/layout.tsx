import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./portal.css";

export const metadata: Metadata = {
  title: "Giriş - StartKey Emlak Sistemi",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body id="kt_body" className="app-blank bgi-size-cover bgi-position-center bgi-no-repeat">
        {children}
      </body>
    </html>
  );
}
