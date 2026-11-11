export function paginate(items, page, pageSize = 25) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Page size must be a positive integer.");
  }
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(Math.trunc(page), 0), pageCount - 1);
  const start = currentPage * pageSize;
  const end = Math.min(start + pageSize, items.length);
  return { items: items.slice(start, end), page: currentPage, pageCount, start, end };
}
