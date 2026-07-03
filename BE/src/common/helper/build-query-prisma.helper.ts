export function buildQueryPrisma(query) {
  let { page, pageSize, filters } = query;
  // kiểm tra nếu có gửi query filters lên
  try {
    filters = JSON.parse(filters);
  } catch (error) {
    filters = {};
  }
  // xử lý filters
  for (const [key, value] of Object.entries(filters)) {
    // 1. Nếu field là Mảng (genres, favoriteGenres)
    if (key === 'genres' || key === 'favoriteGenres') {
      if (Array.isArray(value)) {
        filters[key] = { hasSome: value }; // Tìm phim có CHỨA BẤT KỲ thể loại nào trong mảng truyền lên
      } else {
        filters[key] = { has: value }; // Tìm phim có CHỨA chính xác thể loại này
      }
    }
    // 2. Nếu field là ID (id, Id) hoặc status, type thì giữ nguyên (Tìm chính xác)
    else if (key.endsWith('Id') || key === '_id' || key === 'status' || key === 'userType') {
      filters[key] = value;
    }
    // 3. Các trường Text còn lại (title, name, cast...) thì tìm kiếm mờ (Like / Contains)
    else if (typeof value === "string") {
      filters[key] = {
        contains: value,
        mode: 'insensitive',
      };
    }
  }
  const index = (page - 1) * pageSize;
  const where = {
    ...filters
  };
  return {
    page,
    pageSize,
    where,
    index,
  };
}
