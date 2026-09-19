import { akademiPage } from "../_html";

export const dynamic = "force-dynamic";

export async function GET() {
  return akademiPage("pages/geri-odeme-bilgilendirmesi.html");
}
