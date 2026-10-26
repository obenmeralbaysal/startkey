"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import type { HomepageContent } from "@/content/types";
import type { Locale } from "@/lib/locales";

/** Language code plus a menu of the existing culture-switch links. */
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
    <div className="sk-lang">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="menu"
        className="sk-lang-code"
        onClick={() => setOpen((value) => !value)}
      >
        {currentCode.toUpperCase()}
        <span className="sk-caret" aria-hidden="true">▾</span>
      </button>
      <ul className="sk-lang-menu" hidden={!open} aria-labelledby={id}>
        {content.options.map((option) => (
          <li key={option.code}>
            <a href={`/${currentCode}/Settings/ChangeCulture?langCode=${option.code}&returnPath=${encodeURIComponent(pathname)}`}>
              <img src={`/img/flags/${option.code}.svg`} alt="" width={20} height={14} />
              {option.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
