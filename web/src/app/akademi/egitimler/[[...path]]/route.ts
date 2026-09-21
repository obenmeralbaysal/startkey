import { akademiNotFound, akademiPage } from "../../_html";

export const dynamic = "force-dynamic";

function safeSegment(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  return !value.includes("..") && !value.includes("/") && !value.includes("\\");
}

function termFile(termId: string) {
  const safe = termId.replace(/[^0-9,]/g, "").replace(/,/g, "-");
  return safe ? `pages/egitimler-term-${safe}.html` : "";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const parts = (await context.params).path ?? [];
  const termId = new URL(request.url).searchParams.get("term_id");

  if (parts.length === 0 && termId) {
    const file = termFile(termId);
    if (file) {
      return akademiPage(file);
    }
  }

  if (parts.length === 0) {
    return akademiPage("pages/egitimler.html");
  }

  if (parts[0] === "page" && parts[1] && /^\d+$/.test(parts[1]) && parts.length === 2) {
    return akademiPage(`pages/egitimler-page-${parts[1]}.html`);
  }

  if (
    parts.length === 3
    && safeSegment(parts[0])
    && parts[1] === "egitim-erisimi"
    && safeSegment(parts[2])
  ) {
    return akademiPage(`pages/egitimler/${parts[0]}/egitim-erisimi/${parts[2]}.html`);
  }

  if (parts.length === 1 && safeSegment(parts[0])) {
    return akademiPage(`pages/egitimler/${parts[0]}.html`);
  }

  return akademiNotFound();
}
