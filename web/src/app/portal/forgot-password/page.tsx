import { PortalPassword } from "@/components/portal/PortalPassword";
import { portalLoginLangFromQuery } from "@/content/portal-login";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  return <PortalPassword lang={portalLoginLangFromQuery(lang)} mode="forgot" />;
}
