export function Pagination({
  pageIndex,
  totalPages,
  basePath,
  searchQuery,
  pageParam = "pageIndex",
}: {
  pageIndex: number;
  totalPages: number;
  basePath: string;
  searchQuery: string;
  pageParam?: "page" | "pageIndex";
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchQuery.startsWith("&") ? searchQuery.slice(1) : searchQuery);
    params.delete("page");
    params.delete("pageIndex");
    if (pageParam === "page") {
      if (page > 1) {
        params.set("page", String(page));
      }
    } else {
      params.set("pageIndex", String(page));
    }
    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };
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
