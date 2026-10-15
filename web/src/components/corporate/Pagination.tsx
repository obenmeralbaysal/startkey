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

  const hrefFor = (page: number) => `${basePath}?pageIndex=${page}${searchQuery}`;
  const start = Math.max(1, pageIndex - 5);
  const end = Math.min(totalPages, pageIndex + 5);
  const numbered = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <ul className="sk-page-nav">
      <li>
        <a href={hrefFor(1)}>&laquo;</a>
      </li>
      {numbered.map((page) =>
        page === pageIndex ? (
          <li key={page}>
            <a className="active" aria-current="page">
              {page}
            </a>
          </li>
        ) : (
          <li key={page}>
            <a href={hrefFor(page)}>{page}</a>
          </li>
        ),
      )}
      <li>
        <a href={hrefFor(totalPages)}>&raquo;</a>
      </li>
    </ul>
  );
}
