import { Pagination } from "@/components/corporate/Pagination";
import { Picture } from "@/components/corporate/Picture";
import type { DirectoryCardData } from "@/lib/corporate";

function FramedPhoto({
  href,
  image,
  imageWebp,
  alt,
  width,
  height,
  fill = false,
}: {
  href: string;
  image: string;
  imageWebp?: string;
  alt: string;
  width: number;
  height: number;
  fill?: boolean;
}) {
  return (
    <div className={fill ? "sk-photo-frame sk-photo-frame-fill" : "sk-photo-frame"}>
      <a href={href}>
        <Picture width={width} height={height}>
          {imageWebp ? <source srcSet={imageWebp} type="image/webp" /> : null}
          <img className="sk-photo" src={image} alt={alt} width={width} height={height} style={{ "--sk-photo-w": width, "--sk-photo-h": height }} />
        </Picture>
      </a>
    </div>
  );
}

export function DirectoryCard({ item }: { item: DirectoryCardData; compact?: boolean }) {
  if (item.variant === "office") {
    return (
      <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0px_calc(6px_*_var(--sk-scale,_1))_calc(24px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.07)] [border:1px_solid_transparent] [border-radius:calc(5px_*_var(--sk-scale,_1))] relative [transition:0.4s] after:absolute after:[bottom:calc(-2px_*_var(--sk-scale,_1))] after:[left:50%] after:content-[''] after:[width:0%] after:[height:calc(3px_*_var(--sk-scale,_1))] after:[transform:translate(-50%,_-50%)] after:bg-navy after:[border-radius:0_0_calc(5px_*_var(--sk-scale,_1))_calc(5px_*_var(--sk-scale,_1))] after:[transition:0.4s] hover:[box-shadow:none] hover:[transform:translateY(calc(-5px_*_var(--sk-scale,_1)))] hover:after:[width:85%]">
        <FramedPhoto href={item.urlPath} image={item.image} imageWebp={item.imageWebp} alt="OfficeLogo-photo" width={413} height={194} fill />
        <div className="block">
          <div className="sk-office-info">
            <h3>
              <a href={item.urlPath}>{item.name}</a>
            </h3>
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
