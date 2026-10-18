export interface Item {
  id: number;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  status: 'ACTIVE' | 'CLAIMED' | 'RETURNED' | 'CLOSED';
  imageUrl?: string;
  verificationQuestion?: string;
  category: { id: number; name: string };
  governorate: string;
  delegation: string;
  locality?: string;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  itemDate: string;
  createdAt: string;
  author?: { id: number; name: string; email?: string };
}

export interface PaginatedItems {
  data: Item[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
