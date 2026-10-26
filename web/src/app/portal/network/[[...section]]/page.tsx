import { Suspense } from "react";

import { NetworkApp } from "@/components/portal/network/NetworkApp";

export const dynamic = "force-dynamic";

export default async function NetworkPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  return (
    <Suspense
      fallback={
        <main className="glass-loading" aria-busy="true">
          <img className="glass-logo" alt="StartKey" src="/portal/img/startkey_logo.png" />
          <span className="glass-spinner" />
        </main>
      }
    >
      <NetworkApp parts={section ?? []} />
    </Suspense>
  );
}
