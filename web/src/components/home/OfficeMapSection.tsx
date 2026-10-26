"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  countryChipLabel,
  officeMapHeading,
  officeMapSubtitle,
} from "@/content/office-map";
import type { MapOffice } from "@/lib/api";
import type { Locale } from "@/lib/locales";
import { mapPinPosition, officeCountrySummary } from "@/lib/map-coordinates";
import { officeCardHref, officeForCard } from "@/lib/office-map-card";

const CARD_LINK: Record<Locale, string> = {
  tr: "Ofisi gör →",
  en: "View office →",
  de: "Büro ansehen →",
};

const RESET_LABEL: Record<Locale, string> = {
  tr: "Tümünü göster",
  en: "Show all",
  de: "Alle anzeigen",
};

const OfficeMap = dynamic(
  () => import("@/components/home/OfficeMap").then((mod) => mod.OfficeMap),
  {
    ssr: false,
  },
);

export function OfficeMapSection({
  offices,
  locale,
}: {
  offices: readonly MapOffice[] | null | undefined;
  locale: Locale;
}) {
  const summary = officeCountrySummary(offices);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [center, setCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const cardOffice = officeForCard(offices ?? [], selectedId, center, mapPinPosition);
  const heading = summary
    ? officeMapHeading(locale, summary.officeCount, summary.countries.length)
    : null;
  return (
    <section className="sk-office-map-section" id="sk-office-map-section">
      {summary && heading ? (
        <div className="sk-office-map-head">
          <div>
            <h2>{heading}</h2>
            <p>{officeMapSubtitle[locale]}</p>
          </div>
          <div className="sk-office-map-chips">
            {summary.countries.map((chip) => (
              <span className="sk-office-chip" key={chip.code}>
                {countryChipLabel(locale, chip.code)} {chip.count}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="sk-office-map-frame">
        <OfficeMap
          offices={offices ? [...offices] : []}
          className="is-bleed"
          overview
          label={heading ?? "Startkey Global"}
          resetLabel={RESET_LABEL[locale]}
          onSelect={setSelectedId}
          onCenter={setCenter}
        />
        {cardOffice ? (
          <div className="sk-office-map-card" data-office-id={cardOffice.id}>
            <h4>{cardOffice.name}</h4>
            <a href={officeCardHref(cardOffice)}>{CARD_LINK[locale]}</a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
