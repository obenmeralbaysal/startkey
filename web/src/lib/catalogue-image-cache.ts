export type UpstreamImage = {
  status: number;
  body: Uint8Array | null;
  contentType: string | null;
  cacheControl: string | null;
  etag: string | null;
};

export type ProxiedImage = {
  status: number;
  body: Uint8Array | null;
  headers: Record<string, string>;
};

/** Headers the browser must see. A rewrite must not drop Cache-Control or ETag, and 304 stays empty. */
export function proxyCatalogueImage(upstream: UpstreamImage): ProxiedImage {
  const headers: Record<string, string> = {
    "Cache-Control": upstream.cacheControl ?? "public, max-age=3600",
  };
  if (upstream.contentType && upstream.status !== 304) headers["Content-Type"] = upstream.contentType;
  if (upstream.etag) headers.ETag = upstream.etag;
  if (upstream.status === 304) {
    return { status: 304, body: null, headers };
  }
  return { status: upstream.status, body: upstream.body, headers };
}
