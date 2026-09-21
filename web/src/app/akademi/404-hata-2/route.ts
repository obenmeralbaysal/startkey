import { akademiPage } from "../_html";

export const dynamic = "force-dynamic";

export async function GET() {
  return akademiPage("pages/404-hata-2.html");
}
