import { Pagination } from "@/components/corporate/Pagination";
import { Picture } from "@/components/corporate/Picture";
import { RankBadges } from "@/components/corporate/RankBadges";
import type { DirectoryCardData } from "@/lib/corporate";
import type { Locale } from "@/lib/locales";

function localeOf(path: string): Locale {
  if (path.startsWith("/en/") || path === "/en") return "en";
  if (path.startsWith("/de/") || path === "/de") return "de";
  return "tr";
}

function FramedPhoto({
  href,
  image,
  imageWebp,
  alt,
  width,
  height,
  fill = false,
  contain = false,
}: {
  href: string;
  image: string;
  imageWebp?: string;
  alt: string;
  width: number;
  height: number;
  fill?: boolean;
  contain?: boolean;
}) {
  return (
    <div className={fill ? "sk-photo-frame sk-photo-frame-fill" : "sk-photo-frame"}>
      <a href={href}>
        <Picture width={width} height={height}>
          {imageWebp ? <source srcSet={imageWebp} type="image/webp" /> : null}
          <img
            className={contain ? "sk-photo sk-photo-contain" : "sk-photo"}
            src={image}
            alt={alt}
            width={width}
            height={height}
            style={{ "--sk-photo-w": width, "--sk-photo-h": height }}
          />
        </Picture>
      </a>
    </div>
  );
}

export function DirectoryCard({ item }: { item: DirectoryCardData; compact?: boolean }) {
  if (item.variant === "office") {
    return (
      <div className="agent-card style1">
        <FramedPhoto href={item.urlPath} image={item.image} imageWebp={item.imageWebp} alt="OfficeLogo-photo" width={413} height={194} fill contain />
        <div className="block">
          <div className="sk-office-info">
            <h3>
              <a href={item.urlPath}>{item.name}</a>
            </h3>
            {item.role ? <span>{item.role}</span> : null}
            <AwardBadges badges={item.badges} />
            {item.phoneHref ? (
              <span>
                {" "}
                <i className="ri-phone-line" /> <a href={item.phoneHref} target="_blank">{item.phoneLabel}</a>
              </span>
            ) : null}
            <br />
            {item.location ? (
              <span>
                <i className="flaticon-pin" /> {item.location}
              </span>
            ) : null}
            <ul className="sk-office-social">
              {item.instagram ? (
                <li>
                  <a href={item.instagram} target="_blank">
                    <i className="ri-instagram-line" />
                  </a>
                </li>
              ) : null}
              {item.email ? (
                <li>
                  <a href={`mailto:${item.email}`}>
                    <i className="flaticon-envelope" />
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-card style1">
      <div className="agent-img">
        <FramedPhoto href={item.urlPath} image={item.image} imageWebp={item.imageWebp} alt="User-photo" width={414} height={414} fill />
      </div>
      <div className="agent-info">
        <h3>
          <a href={item.urlPath}>{item.name}</a>
        </h3>
        {item.role ? <span>{item.role}</span> : null}
        <AwardBadges badges={item.badges} />
        <RankBadges badges={item.rankBadges} locale={localeOf(item.urlPath)} variant="card" />
        {item.phoneHref ? (
          <div>
            <i className="flaticon-phone-call" /> <a href={item.phoneHref} target="_blank">{item.phoneLabel}</a>
          </div>
        ) : null}
        {item.email ? (
          <div>
            <i className="flaticon-envelope" /> <a href={`mailto:${item.email}`}> {item.email}</a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const DirectoryPagination = Pagination;

function AwardBadges({ badges }: { badges?: { title: string; period: string }[] }) {
  if (!badges || badges.length === 0) {
    return null;
  }
  return (
    <ul className="sk-award-badges">
      {badges.map((badge) => (
        <li key={`${badge.title}-${badge.period}`}>
          {badge.title}
          {badge.period ? ` · ${badge.period}` : ""}
        </li>
      ))}
    </ul>
  );
}
