"use client";

import Link from "next/link";

export default function PortalError() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1>500</h1>
        <Link href="/portal">Giriş</Link>
      </div>
    </main>
  );
}
