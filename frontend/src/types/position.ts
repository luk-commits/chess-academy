export interface PositionItem {
  id: number;
  fen: string;
  firstMove: string | null;
  opening: string;
  themeTags: string[];
  rating: number | null;
  difficulty: number | null;
}

export interface PositionsResponse {
  items: PositionItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  search: string;
}
