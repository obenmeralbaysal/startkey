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
    "relative w-full overflow-hidden bg-seminar text-center text-white transition-all",
    "px-0 py-[calc(10px*var(--sk-scale,1))] text-[calc(18px*var(--sk-scale,1))] tracking-[calc(2px*var(--sk-scale,1))]",
    state === "hidden" ? "hidden" : "",
    state === "visible" ? "top-0" : "top-[calc(-50px*var(--sk-scale,1))]",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div id="upcomingSeminars" className={className}>
      <a className="[color:White] hover:[color:#e9dfdf]" href={content.href}>
        {` ${content.prefix} `} <span id="seminarCount">{content.count}</span> {content.suffix}
        <div className="absolute [top:0] [left:-100%] [width:200%] h-full [background-image:url('/themes/fela/img/startkeylogosw.png')] [background-repeat:repeat] [background-size:contain] opacity-[0.12] [animation:moveWatermark_55s_linear_infinite]" />
      </a>
    </div>
  );
}
