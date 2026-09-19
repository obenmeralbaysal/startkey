import { Picture } from "@/components/corporate/Picture";
import type { DirectoryCardData } from "@/lib/corporate";

export function DirectoryCard({ item }: { item: DirectoryCardData; compact?: boolean }) {
  if (item.variant === "office") {
    return (
      <div className="agent-card style1">
        <div className="agent-img">
          <a className="" href={item.urlPath}>
            <Picture width={413} height={194}>
              {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
              <img src={item.image} alt="OfficeLogo-photo" width={413} height={194} />
            </Picture>
          </a>
        </div>
        <div className="agent-info-wrap">
          <div className="agent-info">
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
            <ul className="social-profile list-style style1">
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
        <a href={item.urlPath}>
          <Picture width={414} height={414}>
            {item.imageWebp ? <source srcSet={item.imageWebp} type="image/webp" /> : null}
            <img src={item.image} alt="User-photo" width={414} height={414} />
          </Picture>
        </a>
      </div>
      <div className="agent-info-wrap">
        <div className="agent-info" style={{ marginBottom: 0, paddingBottom: 25 }}>
          <h3>
            <a href={item.urlPath}>{item.name}</a>
          </h3>
          {item.role ? <span>{item.role}</span> : null}
          <br />
          {item.phoneHref ? (
            <div className="container align-items-center">
              <i className="flaticon-phone-call" /> <a href={item.phoneHref} target="_blank">{item.phoneLabel}</a>
            </div>
          ) : null}
          {item.email ? (
            <div className="container align-items-center">
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
    <ul className="page-nav list-style mt-10">
      <li className="page-item">
        <a className="" href={hrefFor(1)}>
          &laquo;
        </a>
      </li>
      {numbered.map((page) =>
        page === pageIndex ? (
          <li className="page-item" key={page}>
            <a className=" active">
              <span>{page}</span>
            </a>
          </li>
        ) : (
          <li className="page-item" key={page}>
            <a className="" href={hrefFor(page)}>
              {page}
            </a>
          </li>
        ),
      )}
      <li className="page-item">
        <a className="" href={hrefFor(totalPages)}>
          &raquo;
        </a>
      </li>
    </ul>
  );
}
