function parsePagination(query = {}) {
  const rawPage = Number(query.page) || 1;
  const rawLimit = Number(query.limit) || 10;

  const page = Math.max(rawPage, 1);
  const limit = Math.min(Math.max(rawLimit, 1), 50);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
}

function buildPaginationMeta({ total, page, limit }) {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}

module.exports = {
  parsePagination,
  buildPaginationMeta,
};