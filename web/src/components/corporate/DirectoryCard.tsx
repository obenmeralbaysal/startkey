import { Picture } from "@/components/corporate/Picture";
import type { DirectoryCardData } from "@/lib/corporate";
import { scaled } from "@/lib/scale";

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

const socialItem = "inline-block [margin:0_calc(5px_*_var(--sk-scale,_1))]";
const socialLink =
  "group flex flex-col items-center justify-center w-[calc(42px*var(--sk-scale,1))] h-[calc(42px*var(--sk-scale,1))] rounded-full border border-transparent bg-white [box-shadow:0_0_calc(25px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.1)] transition-all duration-300 ease-in-out hover:bg-brand hover:-translate-y-[3px]";
const socialIcon = "text-navy [font-size:calc(16px_*_var(--sk-scale,_1))] leading-[0.8] transition-all duration-300 ease-in-out group-hover:text-white";

export function DirectoryCard({ item }: { item: DirectoryCardData; compact?: boolean }) {
  if (item.variant === "office") {
    return (
      <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0px_calc(6px_*_var(--sk-scale,_1))_calc(24px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.07)] [border:1px_solid_transparent] [border-radius:calc(5px_*_var(--sk-scale,_1))] relative [transition:0.4s] after:absolute after:[bottom:calc(-2px_*_var(--sk-scale,_1))] after:[left:50%] after:content-[''] after:[width:0%] after:[height:calc(3px_*_var(--sk-scale,_1))] after:[transform:translate(-50%,_-50%)] after:bg-navy after:[border-radius:0_0_calc(5px_*_var(--sk-scale,_1))_calc(5px_*_var(--sk-scale,_1))] after:[transition:0.4s] hover:[box-shadow:none] hover:[transform:translateY(calc(-5px_*_var(--sk-scale,_1)))] hover:after:[width:85%]">
        <FramedPhoto href={item.urlPath} image={item.image} imageWebp={item.imageWebp} alt="OfficeLogo-photo" width={413} height={194} fill />
        <div className="block">
          <div className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))] text-center">
            <h3 className="[font-size:calc(22px_*_var(--sk-scale,_1))] [line-height:1.3] [margin:0_0_calc(5px_*_var(--sk-scale,_1))]">
              <a className="text-navy transition-colors hover:text-brand" href={item.urlPath}>{item.name}</a>
            </h3>
            {item.phoneHref ? (
              <span>
                {" "}
                <i className="ri-phone-line" /> <a className="text-black" href={item.phoneHref} target="_blank">{item.phoneLabel}</a>
              </span>
            ) : null}
            <br />
            {item.location ? (
              <span>
                <i className="flaticon-pin" /> {item.location}
              </span>
            ) : null}
            <ul className="[margin:calc(25px_*_var(--sk-scale,_1))_0_0] p-0 text-center list-none">
              {item.instagram ? (
                <li className={socialItem}>
                  <a className={socialLink} href={item.instagram} target="_blank">
                    <i className={socialIcon + " ri-instagram-line"} />
                  </a>
                </li>
              ) : null}
              {item.email ? (
                <li className={socialItem}>
                  <a className={socialLink} href={`mailto:${item.email}`}>
                    <i className={socialIcon + " flaticon-envelope"} />
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
    <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0px_calc(6px_*_var(--sk-scale,_1))_calc(24px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.07)] [border:1px_solid_transparent] [border-radius:calc(5px_*_var(--sk-scale,_1))] relative [transition:0.4s] after:absolute after:[bottom:calc(-2px_*_var(--sk-scale,_1))] after:[left:50%] after:content-[''] after:[width:0%] after:[height:calc(3px_*_var(--sk-scale,_1))] after:[transform:translate(-50%,_-50%)] after:bg-navy after:[border-radius:0_0_calc(5px_*_var(--sk-scale,_1))_calc(5px_*_var(--sk-scale,_1))] after:[transition:0.4s] hover:[box-shadow:none] hover:[transform:translateY(calc(-5px_*_var(--sk-scale,_1)))] hover:after:[width:85%]">
      <FramedPhoto href={item.urlPath} image={item.image} imageWebp={item.imageWebp} alt="User-photo" width={414} height={414} />
      <div className="block">
        <div className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))_calc(22px_*_var(--sk-scale,_1))] text-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)]" style={{ marginBottom: 0, paddingBottom: scaled(25) }}>
          <h3>
            <a href={item.urlPath}>{item.name}</a>
          </h3>
          {item.role ? <span>{item.role}</span> : null}
          <br />
          {item.phoneHref ? (
            <div className="container items-center">
              <i className="flaticon-phone-call" /> <a href={item.phoneHref} target="_blank">{item.phoneLabel}</a>
            </div>
          ) : null}
          {item.email ? (
            <div className="container items-center">
              <i className="flaticon-envelope" /> <a href={`mailto:${item.email}`}> {item.email}</a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DirectoryPagination({
  pageIndex,
  totalPages,
  basePath,
  searchQuery,
}: {
  pageIndex: number;
  totalPages: number;
  basePath: string;
  searchQuery: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (page: number) => `${basePath}?pageIndex=${page}${searchQuery}`;
  const start = Math.max(1, pageIndex - 5);
  const end = Math.min(totalPages, pageIndex + 5);
  const numbered = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <ul className="text-center list-none p-0 [margin:calc(10px_*_var(--sk-scale,_1))_0_0]">
      <li className={pageItem}>
        <a className={pageLink} href={hrefFor(1)}>
          &laquo;
        </a>
      </li>
      {numbered.map((page) =>
        page === pageIndex ? (
          <li className={pageItem} key={page}>
            <a className={pageActive} aria-current="page">
              {page}
            </a>
          </li>
        ) : (
          <li className={pageItem} key={page}>
            <a className={pageLink} href={hrefFor(page)}>
              {page}
            </a>
          </li>
        ),
      )}
      <li className={pageItem}>
        <a className={pageLink} href={hrefFor(totalPages)}>
          &raquo;
        </a>
      </li>
    </ul>
  );
}

const pageItem = "inline-block [margin:0_calc(5px_*_var(--sk-scale,_1))]";
const pageShape =
  "block w-[calc(45px*var(--sk-scale,1))] h-[calc(45px*var(--sk-scale,1))] rounded-full text-center [font-size:calc(16px_*_var(--sk-scale,_1))] [line-height:calc(44px_*_var(--sk-scale,_1))] font-normal transition-all duration-[400ms] ease-in-out max-[575px]:w-[36px] max-[575px]:h-[36px] max-[575px]:[line-height:36px]";
const pageLink = `${pageShape} bg-[#f9f9f9] text-[#666] opacity-70 hover:bg-brand hover:text-white hover:opacity-100`;
const pageActive = `${pageShape} bg-brand text-white opacity-100`;
