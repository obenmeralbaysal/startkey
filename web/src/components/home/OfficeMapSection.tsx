"use client";

import dynamic from "next/dynamic";

import type { MapOffice } from "@/lib/api";
import type { Locale } from "@/lib/locales";

const RESET_LABEL: Record<Locale, string> = {
  tr: "Tümünü göster",
  en: "Show all",
  de: "Alle anzeigen",
};

const OfficeMap = dynamic(() => import("@/components/home/OfficeMap").then((mod) => mod.OfficeMap), {
  ssr: false,
});

export function OfficeMapSection({ offices, locale }: { offices: MapOffice[]; locale: Locale }) {
  return (
    <section className="bg-seashell [padding-top:calc(70px_*_var(--sk-scale,_1))] [padding-bottom:calc(40px_*_var(--sk-scale,_1))] max-md:[padding-top:calc(40px_*_var(--sk-scale,_1))]">
      <div className="container">
        <div className="sk-section-title is-center [margin-bottom:calc(30px_*_var(--sk-scale,_1))]" data-aos="fade-up" data-aos-duration="1200">
          <h2>Startkey Global</h2>
        </div>
      </div>
      <div data-aos="fade-up" data-aos-duration="1200">
        <OfficeMap offices={offices} className="is-bleed" overview resetLabel={RESET_LABEL[locale]} />
      </div>
    </section>
  );
}
