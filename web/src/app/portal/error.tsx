"use client";

import Link from "next/link";

export default function PortalError() {
  return (
    <main className="glass-login">
      <section className="glass-panel">
        <h1>Bir sorun oluştu</h1>
        <p className="glass-muted">Sayfa yenilenince işlem yeniden denenebilir.</p>
        <Link className="glass-btn" href="/portal">
          Giriş
        </Link>
      </section>
    </main>
  );
}
