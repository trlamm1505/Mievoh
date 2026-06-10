import api from '../config/axios/axiosConfig';

export interface CinemaSystem {
  cinemaSystemId: string;
  name: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
  CinemaComplexes?: CinemaComplex[];
}

export interface CinemaComplex {
  cinemaComplexId: string;
  name: string | null;
  address: string | null;
  cinemaSystemId: string | null;
  createdAt: string;
  updatedAt: string;
  CinemaSystem?: CinemaSystem;
  Cinemas?: Cinema[];
}

export interface Cinema {
  cinemaId: string;
  name: string | null;
  cinemaComplexId: string | null;
  createdAt: string;
  updatedAt: string;
  CinemaComplex?: CinemaComplex;
}

export interface Showtime {
  showtimeId: string;
  cinemaId: string | null;
  movieId: string | null;
  showDateTime: string | null;
  format: string | null;
  ticketPrice: number | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  Cinema?: Cinema;
}

/**
 * Lấy danh sách hệ thống rạp
 * GET /api/cinema-systems
 */
export const getCinemaSystemsApi = async (): Promise<CinemaSystem[]> => {
  const response = await api.get<any>('/cinema-systems');
  // Since the response wraps system list in {data: CinemaSystem[], total: number}
  // check if response data is in that format and extract it.
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return response.data;
};

/**
 * Lấy danh sách cụm rạp (Có thể lọc theo hệ thống rạp bằng cinemaSystemId)
 * GET /api/cinema-complexes
 */
export const getCinemaComplexesApi = async (
  cinemaSystemId?: string
): Promise<CinemaComplex[]> => {
  const params = cinemaSystemId ? { cinemaSystemId } : undefined;
  const response = await api.get<any>('/cinema-complexes', { params });
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return response.data;
};

/**
 * Lấy chi tiết cụm rạp
 * GET /api/cinema-complexes/:cinemaComplexId
 */
export const getCinemaComplexDetailApi = async (
  cinemaComplexId: string
): Promise<CinemaComplex> => {
  const response = await api.get<any>(`/cinema-complexes/${cinemaComplexId}`);
  return response.data;
};

/**
 * Lấy danh sách rạp chiếu / phòng chiếu thuộc một cụm rạp
 * GET /api/cinemas
 */
export const getCinemasApi = async (
  cinemaComplexId: string
): Promise<Cinema[]> => {
  const response = await api.get<any>('/cinemas', {
    params: { cinemaComplexId },
  });
  return response.data;
};

/**
 * Lấy lịch chiếu của 1 Cụm rạp (Gom nhóm theo Phim)
 * GET /api/showtimes/complex/:complexId
 */
export const getShowtimesByComplexApi = async (
  complexId: string,
  date?: string
): Promise<any> => {
  const params = date ? { date } : undefined;
  const response = await api.get<any>(`/showtimes/complex/${complexId}`, { params });
  return response.data;
};
