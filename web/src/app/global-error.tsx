"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <html lang="tr">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <h1>500</h1>
            <Link href="/tr">Anasayfa</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
