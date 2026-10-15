"use client";

import Link from "next/link";

import { Icon } from "@/components/portal/shell";

export default function PortalError() {
  return (
    <main className="glass-login">
      <section className="glass-panel glass-confirm">
        <div className="glass-hero-icon"><Icon name="alert" /></div>
        <h1>Bir sorun oluştu</h1>
        <p className="glass-muted">Sayfa yenilenince işlem yeniden denenebilir.</p>
        <Link className="glass-btn" href="/portal">
          Giriş
        </Link>
      </section>
    </main>
  );
}
