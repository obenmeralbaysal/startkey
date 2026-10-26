import { proxyCatalogueImage } from "@/lib/catalogue-image-cache";

export const dynamic = "force-dynamic";

const KIND = /^(offices|consultants|portfolios)$/;
const NUM = /^\d+$/;

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; id: string; index?: string[] }> },
) {
  const { kind, id, index } = await context.params;
  const frame = index?.[0];
  if (!KIND.test(kind) || !NUM.test(id) || (frame !== undefined && !NUM.test(frame))) {
    return new Response(null, { status: 404 });
  }

  const base = (process.env.API_BASE_URL ?? "http://nginx").replace(/\/$/, "");
  const suffix = frame !== undefined ? `/${frame}` : "";
  const headers = new Headers({ Accept: "image/*" });
  const match = request.headers.get("if-none-match");
  if (match) headers.set("If-None-Match", match);

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/v1/catalogue/media/${kind}/${id}${suffix}`, {
      headers,
      cache: "no-store",
    });
  } catch {
    return new Response(null, { status: 404 });
  }

  const proxied = proxyCatalogueImage({
    status: upstream.status,
    body: upstream.status === 304 ? null : new Uint8Array(await upstream.arrayBuffer()),
    contentType: upstream.headers.get("content-type"),
    cacheControl: upstream.headers.get("cache-control"),
    etag: upstream.headers.get("etag"),
  });

  return new Response(proxied.body ? Buffer.from(proxied.body) : null, {
    status: proxied.status,
    headers: proxied.headers,
  });
}
