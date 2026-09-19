import { akademiPage } from "../_html";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const parts = (await context.params).path ?? [];
  if (!parts.length || parts.some((part) => !part || part.includes("..") || part.includes("/") || part.includes("\\"))) {
    return new Response("Not found", { status: 404 });
  }
  return akademiPage(`pages/${parts.join("/")}.html`);
}
