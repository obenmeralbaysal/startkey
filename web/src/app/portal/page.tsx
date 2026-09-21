import { PortalLogin } from "@/components/portal/PortalLogin";
import { portalLoginLangFromQuery } from "@/content/portal-login";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  return <PortalLogin lang={portalLoginLangFromQuery(lang)} />;
}
