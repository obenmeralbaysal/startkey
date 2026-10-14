import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404",
};

export default function PortalNotFound() {
  return (
    <main className="glass-login">
      <section className="glass-panel">
        <h1>Sayfa yok</h1>
        <Link className="glass-btn" href="/portal">
          Giriş
        </Link>
      </section>
    </main>
  );
}
