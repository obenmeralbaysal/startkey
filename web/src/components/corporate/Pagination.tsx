export function Pagination({
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

  const hrefFor = (page: number) => {
    const query = `pageIndex=${page}${searchQuery}`;
    return `${basePath}?${query}`;
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <ul className="page-nav list-style mt-10">
      <li className="page-item">
        <a className="" href={hrefFor(1)}>
          &laquo;
        </a>
      </li>
      {pages.map((page) =>
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
