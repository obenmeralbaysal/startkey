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
    <ul className="text-center list-none [margin-top:calc(10px_*_var(--sk-scale,_1))]">
      <li className="inline-block">
        <a className="" href={hrefFor(1)}>
          &laquo;
        </a>
      </li>
      {pages.map((page) =>
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
