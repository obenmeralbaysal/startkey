"use client";

import { useEffect, useState } from "react";

import type { HomepageContent } from "@/content/types";

/**
 * Announcement bar for upcoming seminars.
 *
 * It reproduces the reference website's inline script: the bar is rendered with the
 * `hidden` class, which is removed once the document is ready, and 250 ms later the
 * `visible` class slides it down. It is only rendered when a seminar is announced.
 */
export function SeminarBar({ content }: { content: HomepageContent["seminarBar"] }) {
  const [state, setState] = useState<"hidden" | "ready" | "visible">("hidden");

  useEffect(() => {
    setState("ready");
    const timer = window.setTimeout(() => setState("visible"), 250);
    return () => window.clearTimeout(timer);
  }, []);

  if (content.count <= 0) {
    return null;
  }

  const className = [
    "upcoming-seminars",
    state === "hidden" ? "hidden" : "",
    state === "visible" ? "visible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div id="upcomingSeminars" className={className}>
      <a className="seminarText" href={content.href}>
        {` ${content.prefix} `} <span id="seminarCount">{content.count}</span> {content.suffix}
        <div className="watermark" />
      </a>
    </div>
  );
}
