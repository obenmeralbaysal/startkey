import type { Metadata } from "next";
import Link from "next/link";

import { Icon } from "@/components/portal/shell";

export const metadata: Metadata = {
  title: "404",
};

export default function PortalNotFound() {
  return (
    <main className="glass-login">
      <section className="glass-panel glass-confirm">
        <div className="glass-hero-icon"><Icon name="search" /></div>
        <h1>Sayfa yok</h1>
        <Link className="glass-btn" href="/portal">
          Giriş
        </Link>
      </section>
    </main>
  );
}
