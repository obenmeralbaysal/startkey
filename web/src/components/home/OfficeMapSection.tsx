"use client";

import dynamic from "next/dynamic";

import { officeCountUnit } from "@/content/office-map";
import type { MapOffice } from "@/lib/api";
import type { Locale } from "@/lib/locales";
import { officeMapCountText } from "@/lib/map-coordinates";

const RESET_LABEL: Record<Locale, string> = {
  tr: "Tümünü göster",
  en: "Show all",
  de: "Alle anzeigen",
};

const OfficeMap = dynamic(() => import("@/components/home/OfficeMap").then((mod) => mod.OfficeMap), {
  ssr: false,
});

export function OfficeMapSection({
  offices,
  locale,
}: {
  offices: readonly MapOffice[] | null | undefined;
  locale: Locale;
}) {
  const officeCount = officeMapCountText(officeCountUnit[locale], offices);
  return (
    <section className="bg-seashell [padding-top:calc(70px_*_var(--sk-scale,_1))] [padding-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(40px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="sk-section-title is-center [margin-bottom:calc(30px_*_var(--sk-scale,_1))]" data-aos="fade-up" data-aos-duration="1200">
          <h2>Startkey Global</h2>
          {officeCount ? <p className="sk-office-count">{officeCount}</p> : null}
        </div>
      </div>
      <div data-aos="fade-up" data-aos-duration="1200">
        <OfficeMap offices={offices ? [...offices] : []} className="is-bleed" overview resetLabel={RESET_LABEL[locale]} />
      </div>
    </section>
  );
}
