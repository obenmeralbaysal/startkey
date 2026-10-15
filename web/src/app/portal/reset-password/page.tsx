import { PortalPassword } from "@/components/portal/PortalPassword";
import { portalLoginLangFromQuery } from "@/content/portal-login";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; token?: string }>;
}) {
  const { lang, token } = await searchParams;
  return <PortalPassword lang={portalLoginLangFromQuery(lang)} mode="reset" token={token ?? ""} />;
}
