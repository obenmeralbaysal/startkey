import { forbidden } from "next/navigation";
import { headers } from "next/headers";

import { settingsHttpDecision } from "@/components/portal/office/access";
import { config } from "@/lib/config";

import { OfficePageClient } from "./office-client";

export const dynamic = "force-dynamic";

export default async function OfficePage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = await params;
  const parts = section ?? [];
  const tab = parts[0] === "settings" ? parts[1] : undefined;
  if (tab && (await settingsClosed(tab))) forbidden();
  return <OfficePageClient parts={parts} />;
}

async function settingsClosed(tab: string): Promise<boolean> {
  const cookie = portalCookie((await headers()).get("cookie"));
  if (!cookie) return false;
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/portal/office/me`, {
      headers: { Accept: "application/json", Cookie: `startkey_portal=${cookie}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return false;
    return settingsHttpDecision(tab, await response.json()) === "deny";
  } catch {
    return false;
  }
}

function portalCookie(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const piece = part.trim();
    const eq = piece.indexOf("=");
    if (eq > 0 && piece.slice(0, eq) === "startkey_portal") return piece.slice(eq + 1);
  }
  return null;
}
