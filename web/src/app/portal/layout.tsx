import type { Metadata } from "next";
import type { ReactNode } from "react";

import { imageSizeCss, SCALE_CSS } from "@/lib/scale";

import "./portal.css";

// Logo widths rendered by the portal pages.
const SCALE_STYLE = SCALE_CSS + imageSizeCss([175, 220, 250], []);

export const metadata: Metadata = {
  title: "Giriş - StartKey Emlak Sistemi",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: SCALE_STYLE }} />
      </head>
      <body id="kt_body" className="app-blank bgi-size-cover bgi-position-center bgi-no-repeat">
        {children}
      </body>
    </html>
  );
}
