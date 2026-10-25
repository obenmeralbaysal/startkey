"use client";

import { useEffect } from "react";

/** Lets the shared footer hide its map on the 404 page. */
export function MarkHttpError({ code }: { code: number }) {
  useEffect(() => {
    document.body.dataset.skHttp = String(code);
    return () => {
      delete document.body.dataset.skHttp;
    };
  }, [code]);

  return null;
}
