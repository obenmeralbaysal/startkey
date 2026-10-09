import { Picture } from "@/components/corporate/Picture";
import type { DirectoryCardData } from "@/lib/corporate";
import { scaled } from "@/lib/scale";

export function DirectoryCard({ item }: { item: DirectoryCardData; compact?: boolean }) {
  if (item.variant === "office") {
    return (
      <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0px_calc(6px_*_var(--sk-scale,_1))_calc(24px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.07)] [border:1px_solid_transparent] [border-radius:calc(5px_*_var(--sk-scale,_1))] relative [transition:0.4s] after:absolute after:[bottom:calc(-2px_*_var(--sk-scale,_1))] after:[left:50%] after:content-[''] after:[width:0%] after:[height:calc(3px_*_var(--sk-scale,_1))] after:[transform:translate(-50%,_-50%)] after:bg-navy after:[border-radius:0_0_calc(5px_*_var(--sk-scale,_1))_calc(5px_*_var(--sk-scale,_1))] after:[transition:0.4s] hover:[box-shadow:none] hover:[transform:translateY(calc(-5px_*_var(--sk-scale,_1)))] hover:after:[width:85%]">
        <div className="[width:calc(70px_*_var(--sk-scale,_1))] [height:calc(70px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] overflow-hidden relative max-lg:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
          <a className="" href={item.urlPath}>
            <Picture width={413} height={194}>
              {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
              <img src={item.image} alt="OfficeLogo-photo" width={413} height={194} />
            </Picture>
          </a>
        </div>
        <div className="block">
          <div className="[padding:calc(22px_*_var(--sk-scale,_1))_calc(25px_*_var(--sk-scale,_1))_calc(22px_*_var(--sk-scale,_1))] text-center [margin-bottom:calc(25px_*_var(--sk-scale,_1))] [padding-bottom:calc(25px_*_var(--sk-scale,_1))] [border-bottom:1px_solid_rgba(0,_0,_0,_0.09)]">
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
            <ul className="[margin:calc(20px_*_var(--sk-scale,_1))_0_calc(20px_*_var(--sk-scale,_1))] [margin-top:calc(25px_*_var(--sk-scale,_1))] text-right max-md:text-center list-none">
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
    <div className="[margin-bottom:calc(25px_*_var(--sk-scale,_1))] [box-shadow:0px_calc(6px_*_var(--sk-scale,_1))_calc(24px_*_var(--sk-scale,_1))_rgba(0,_0,_0,_0.07)] [border:1px_solid_transparent] [border-radius:calc(5px_*_var(--sk-scale,_1))] relative [transition:0.4s] after:absolute after:[bottom:calc(-2px_*_var(--sk-scale,_1))] after:[left:50%] after:content-[''] after:[width:0%] after:[height:calc(3px_*_var(--sk-scale,_1))] after:[transform:translate(-50%,_-50%)] after:bg-navy after:[border-radius:0_0_calc(5px_*_var(--sk-scale,_1))_calc(5px_*_var(--sk-scale,_1))] after:[transition:0.4s] hover:[box-shadow:none] hover:[transform:translateY(calc(-5px_*_var(--sk-scale,_1)))] hover:after:[width:85%]">
      <div className="[width:calc(70px_*_var(--sk-scale,_1))] [height:calc(70px_*_var(--sk-scale,_1))] [border-radius:calc(5px_*_var(--sk-scale,_1))] overflow-hidden relative max-lg:[margin-bottom:calc(25px_*_var(--sk-scale,_1))]">
        <a href={item.urlPath}>
          <Picture width={414} height={414}>
            {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
            <img src={item.image} alt="User-photo" width={414} height={414} />
          </Picture>
        </a>
      </div>
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
    <ul className="text-center list-none [margin-top:calc(10px_*_var(--sk-scale,_1))]">
      <li className="inline-block">
        <a className="" href={hrefFor(1)}>
          &laquo;
        </a>
      </li>
      {numbered.map((page) =>
        page === pageIndex ? (
          <li className="inline-block" key={page}>
            <a className="">
              <span>{page}</span>
            </a>
          </li>
        ) : (
          <li className="inline-block" key={page}>
            <a className="" href={hrefFor(page)}>
              {page}
            </a>
          </li>
        ),
      )}
      <li className="inline-block">
        <a className="" href={hrefFor(totalPages)}>
          &raquo;
        </a>
      </li>
    </ul>
  );
}
