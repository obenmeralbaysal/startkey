import Link from "next/link";

import { Icon } from "@/components/portal/shell";
import { NETWORK_OFFICE_MISSING } from "@/lib/portal-network";

export function OfficeMissing() {
  return (
    <main className="glass-login">
      <section className="glass-panel glass-confirm">
        <div className="glass-hero-icon"><Icon name="search" /></div>
        <h1>{NETWORK_OFFICE_MISSING}</h1>
        <Link className="glass-btn" href="/portal/network/offices">
          Ofisler
        </Link>
      </section>
    </main>
  );
}
