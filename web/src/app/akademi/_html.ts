import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

const NOT_FOUND_PAGE = "pages/404-hata-2.html";

function htmlResponse(html: string, status = 200): NextResponse {
  return new NextResponse(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export async function akademiNotFound(): Promise<NextResponse> {
  try {
    const html = await readFile(join(process.cwd(), "public/akademi", NOT_FOUND_PAGE), "utf8");
    return htmlResponse(html, 404);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

export async function akademiPage(relativePath: string, init?: { status?: number }): Promise<NextResponse> {
  try {
    const html = await readFile(join(process.cwd(), "public/akademi", relativePath), "utf8");
    return htmlResponse(html, init?.status ?? 200);
  } catch {
    return akademiNotFound();
  }
}
