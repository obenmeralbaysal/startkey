"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import type { HomepageContent } from "@/content/types";
import type { Locale } from "@/lib/locales";

/**
 * Flag plus the language name. Measured on startkey.com.tr: 13px, weight 500, #535353.
 * Lengths are reference pixels; --sk-scale makes desktop and tablet 80%.
 */
export function LanguageSelector({
  content,
  currentCode,
  id,
}: {
  content: HomepageContent["languageSwitcher"];
  currentCode: Locale;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || `/${currentCode}`;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        className="inline-flex items-center border-0 bg-transparent font-medium text-[#535353]"
        style={{
          gap: "calc(6px * var(--sk-scale, 1))",
          height: "calc(28px * var(--sk-scale, 1))",
          fontSize: "calc(13px * var(--sk-scale, 1))",
          padding: 0,
        }}
        onClick={() => setOpen((value) => !value)}
      >
        <img
          src={`/img/flags/${currentCode}.svg`}
          alt=""
          width={20}
          height={14}
          className="block object-cover"
          style={{
            width: "calc(20px * var(--sk-scale, 1))",
            height: "calc(14px * var(--sk-scale, 1))",
            maxWidth: "none",
          }}
        />
        {content.current}
        <i className="ri-arrow-down-s-line" style={{ fontSize: "calc(16px * var(--sk-scale, 1))" }} />
      </button>
      <ul
        className={`${open ? "block" : "hidden"} absolute left-0 z-[99] bg-white shadow-lg`}
        style={{
          top: "calc(36px * var(--sk-scale, 1))",
          minWidth: "calc(160px * var(--sk-scale, 1))",
          padding: "calc(8px * var(--sk-scale, 1)) 0",
        }}
        aria-labelledby={id}
      >
        {content.options.map((option) => (
          <li key={option.code}>
            <a
              className="flex items-center text-black hover:text-brand"
              style={{
                gap: "calc(8px * var(--sk-scale, 1))",
                padding: "calc(6px * var(--sk-scale, 1)) calc(12px * var(--sk-scale, 1))",
                fontSize: "calc(14px * var(--sk-scale, 1))",
              }}
              href={`/${currentCode}/Settings/ChangeCulture?langCode=${option.code}&returnPath=${encodeURIComponent(pathname)}`}
            >
              <img
                src={`/img/flags/${option.code}.svg`}
                alt=""
                width={20}
                height={14}
                className="block object-cover"
                style={{
                  width: "calc(20px * var(--sk-scale, 1))",
                  height: "calc(14px * var(--sk-scale, 1))",
                  maxWidth: "none",
                }}
              />
              {option.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
