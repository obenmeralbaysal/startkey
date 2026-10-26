import { Suspense } from "react";
import { notFound } from "next/navigation";

import { NetworkApp } from "@/components/portal/network/NetworkApp";
import { networkOfficeId } from "@/lib/portal-network";

export const dynamic = "force-dynamic";

export default async function NetworkPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const parts = section ?? [];
  if (networkOfficeId(parts) !== null) notFound();
  return (
    <Suspense
      fallback={
        <main className="glass-loading" aria-busy="true">
          <img className="glass-logo" alt="StartKey" src="/portal/img/startkey_logo.png" />
          <span className="glass-spinner" />
        </main>
      }
    >
      <NetworkApp parts={parts} />
    </Suspense>
  );
}
