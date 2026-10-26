import { Suspense } from "react";

import { NetworkApp } from "@/components/portal/network/NetworkApp";

export const dynamic = "force-dynamic";

export default function NetworkPage() {
  return (
    <Suspense
      fallback={
        <main className="glass-loading" aria-busy="true">
          <img className="glass-logo" alt="StartKey" src="/portal/img/startkey_logo.png" />
          <span className="glass-spinner" />
        </main>
      }
    >
      <NetworkApp />
    </Suspense>
  );
}
