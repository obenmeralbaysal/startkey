"use client";

import { useMemo, useState } from "react";

import { Breadcrumb } from "@/components/corporate/Breadcrumb";
import { DirectoryCard } from "@/components/corporate/DirectoryCard";
import { ListingCard } from "@/components/corporate/ListingCard";
import { Picture } from "@/components/corporate/Picture";
import { RankBadges } from "@/components/corporate/RankBadges";
import { rankBadgesOf } from "@/content/rank-badges";
import { OfficeMap } from "@/components/home/OfficeMap";
import type { CorporatePayload } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";
import { mapPinPosition } from "@/lib/map-coordinates";

function localeOf(path: string): Locale {
  if (path.startsWith("/en/") || path === "/en") return "en";
  if (path.startsWith("/de/") || path === "/de") return "de";
  return "tr";
}

type OfficeDetailData = Extract<CorporatePayload, { kind: "office-detail" }>;

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "ri-instagram-line",
  facebook: "ri-facebook-fill",
  linkedin: "ri-linkedin-fill",
  twitter: "ri-twitter-fill",
  youtube: "ri-youtube-fill",
  tiktok: "ri-tiktok-fill",
  whatsapp: "ri-whatsapp-line",
};

export function OfficeDetail({ data }: { data: OfficeDetailData }) {
  const pin = useMemo(() => {
    if (!data.pin) {
      return null;
    }
    const position = mapPinPosition(data.pin.latitude, data.pin.longitude);
    return position ? { ...data.pin, latitude: position.latitude, longitude: position.longitude } : null;
  }, [data.pin]);
  const pins = useMemo(() => (pin ? [pin] : []), [pin]);
  const socialLinks = data.social?.length ? data.social : data.instagram ? [{ network: "instagram", href: data.instagram }] : [];
  const tabs = pin ? data.tabs : data.tabs.filter((tab) => tab.id !== "tab_3");
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "tab_1");
  const mapQuery = pin ? `${pin.latitude},${pin.longitude}` : "";

  return (
    <>
      <Breadcrumb breadcrumb={data.breadcrumb} />
      <div className="container sk-agent-page">
        <div className="sk-agent">
          <div className="sk-agent-row">
            <div className="sk-agent-half sk-agent-photo">
              <div className="sk-photo-frame sk-photo-frame-detail sk-photo-frame-fill">
                <Picture width={576} height={269}>
                  {data.imageWebp ? <source srcSet={data.imageWebp} type="image/webp" /> : null}
                  <img className="sk-photo" src={data.image} alt="OfficeLogo-photo" width={576} height={269} style={{ "--sk-photo-w": 576, "--sk-photo-h": 269 }} />
                </Picture>
              </div>
            </div>
            <div className="sk-agent-half">
              <div className="sk-agent-name">
                <h2>{data.name}</h2>
                <RankBadges badges={rankBadgesOf(data)} locale={localeOf(data.urlPath)} variant="detail" />
              </div>
              <ul className="sk-agent-info">
                {data.phoneHref ? (
                  <li>
                    <i className="ri-phone-line" /> <a href={data.phoneHref} target="_blank">{data.phoneLabel}</a>
                  </li>
                ) : null}
                {data.email ? (
                  <li>
                    <i className="flaticon-envelope" /> <a href={`mailto:${data.email}`}> {data.email}</a>
                  </li>
                ) : null}
                {data.address ? (
                  <li>
                    <i className="flaticon-pin" /> {data.address}
                  </li>
                ) : null}
              </ul>
              {socialLinks.length > 0 ? (
                <ul className="sk-office-social">
                  {socialLinks.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.network}>
                        <i className={SOCIAL_ICONS[link.network] ?? "ri-links-line"} />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {data.portfoliosLabel ? (
                <a className="sk-btn" href={data.portfoliosHref}>{data.portfoliosLabel}</a>
              ) : null}
            </div>
            <div>
              <ul className="sk-agent-tabs" role="tablist">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button className={tab.id === activeId ? "active" : ""} type="button" role="tab" aria-selected={tab.id === activeId} onClick={() => setActiveId(tab.id)}>
                      {tab.label}
                    </button>
                  </li>
                ))}
              </ul>
              {activeId === "tab_1" ? (
                <div>
                  {data.teamGroups.map((group) => (
                    <div className="flex flex-wrap justify-center" key={group.heading || "team"}>
                      {group.heading ? <h3 className="sk-highlight">{group.heading}</h3> : null}
                      {group.members.map((member) => (
                        <div className="box-border w-full px-[12px] md:w-1/3" key={member.externalId}>
                          <DirectoryCard item={member} />
                        </div>
                      ))}
                      <hr className="sk-team-rule" />
                    </div>
                  ))}
                </div>
              ) : null}
              {activeId === "tab_2" ? (
                <div>
                  {data.listings.length > 0 ? (
                    <div className="homepage-featured-prop" data-carousel="cards">
                      {data.listings.map((item) => (
                        <ListingCard item={{ ...item, style: "style6" }} key={`office-listing-${item.externalId}`} />
                      ))}
                    </div>
                  ) : data.emptyListingsLabel ? (
                    <p className="sk-empty-listings">{data.emptyListingsLabel}</p>
                  ) : null}
                  {data.seeAllLabel ? (
                    <a className="sk-btn" href={data.seeAllHref}>{data.seeAllLabel}</a>
                  ) : null}
                </div>
              ) : null}
              {activeId === "tab_3" && pin ? (
                <div>
                  {data.map.directionsLabel ? (
                    <div className="sk-map-actions">
                      <button className="sk-btn sk-btn-navy" type="button" onClick={() => window.open(`https://www.google.com/maps/dir//${encodeURIComponent(mapQuery)}/`, "_blank")}>
                        <i className="ri-direction-fill" /> {data.map.directionsLabel}
                      </button>
                      <button className="sk-btn" type="button" onClick={() => window.open(`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&layer=c`, "_blank")}>
                        <i className="ri-user-location-fill" /> {data.map.streetViewLabel}
                      </button>
                    </div>
                  ) : null}
                  <div className="sk-office-detail-map">
                    <OfficeMap offices={pins} zoom={15} label={data.name} className="is-detail" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
