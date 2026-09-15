import type {
  AnalyticsSummary,
  Category,
  CategoryInput,
  DashboardSummary,
  HomeSections,
  Order,
  PaginatedProducts,
  Product,
  ProductInput,
  ProductsParams,
  Review,
  ReviewInput,
  Settings,
  SettingsInput,
} from './types';

// Configurable base URL: set VITE_API_URL or __API_URL__ to override.
// Defaults to a relative URL so the front proxies /api to the backend
// (works from any device on the LAN during dev).
const API_URL =
  (typeof window !== 'undefined' && (window as any).__API_URL__) ||
  import.meta.env?.VITE_API_URL ||
  '';

const TOKEN_KEY = 'achat_admin_token';

export const authToken = {
  get: () => (typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null),
  set: (token: string) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? authToken.get() : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getProducts: (params: ProductsParams = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    if (params.stockStatus) query.set('stockStatus', params.stockStatus);
    if (params.sort) query.set('sort', params.sort);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<PaginatedProducts>(`/api/products${qs ? `?${qs}` : ''}`);
  },
  getAllProducts: () => request<Product[]>('/api/products/all'),
  getProduct: (id: number | string) => request<Product>(`/api/products/${id}`),
  listProducts: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') query.set(k, String(v));
    }
    const qs = query.toString();
    return request<{ items: Product[]; total: number }>(`/api/products${qs ? `?${qs}` : ''}`);
  },
  listFeaturedProducts: (limit = 8) => request<Product[]>(`/api/products/featured?limit=${limit}`),
  listFlashSaleProducts: (limit = 10) => request<Product[]>(`/api/products/flash-sale?limit=${limit}`),
  listTopProducts: (limit = 8) => request<Product[]>(`/api/products/top?limit=${limit}`),
  getHomeSections: (limit = 10) => request<HomeSections>(`/api/products/home-sections?limit=${limit}`),
  getRelatedProducts: (id: number | string) => request<Product[]>(`/api/products/${id}/related`),
  getRecommendedProducts: (id: number | string) => request<{ frequentlyBoughtTogether: Product[]; mayAlsoLike: Product[] }>(`/api/products/${id}/recommended`),
  createProduct: (data: ProductInput) =>
    request<Product>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: ProductInput) =>
    request<Product>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) =>
    request<{ ok: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),

  getCategories: (search?: string) =>
    request<Category[]>(`/api/categories${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getCategoryBySlug: (slug: string) => request<Category>(`/api/categories/by-slug/${encodeURIComponent(slug)}`),
  createCategory: (data: CategoryInput) =>
    request<Category>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: CategoryInput) =>
    request<Category>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: number) =>
    request<{ ok: boolean }>(`/api/categories/${id}`, { method: 'DELETE' }),

  getOrders: () => request<Order[]>('/api/orders'),
  listOrders: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') query.set(k, String(v));
    const qs = query.toString();
    return request<Order[]>(`/api/orders${qs ? `?${qs}` : ''}`);
  },
  createOrder: (data: Partial<Order> & { items?: { productId: number; quantity: number }[] }) => {
    // Support both the old shape (direct) and the new achat-plus shape ({ data: { customerName, ... } }).
    const body = (data && (data as any).data) ?? data;
    const payload = {
      customer: body.customerName ?? body.customer ?? (body.name ?? null),
      phone: body.customerPhone ?? body.phone ?? (body.phone ?? null),
      products: body.productName ?? body.products ?? (body.quantity ? String(body.quantity) : ''),
      amount: Number(body.totalPrice ?? body.amount ?? 0),
      status: body.status ?? 'new',
      source: body.source ?? 'web',
      items: body.items ?? (body.productId ? [{ productId: body.productId, quantity: body.quantity ?? 1 }] : undefined),
    };
    return request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateOrder: (id: number, data: Partial<Order>) =>
    request<Order>(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id: number) => request<{ ok: boolean }>(`/api/orders/${id}`, { method: 'DELETE' }),

  getSettings: () => request<Settings>('/api/settings'),
  updateSettings: (data: SettingsInput) =>
    request<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),

  getReviews: (productId?: number) =>
    request<Review[]>(`/api/reviews${productId != null ? `?productId=${productId}` : ''}`),
  getAllReviews: (status: 'approved' | 'pending' | 'rejected' = 'pending') =>
    request<Review[]>(`/api/reviews?status=${status}`),
  createReview: (data: ReviewInput) =>
    request<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
  updateReview: (id: number, status: Review['status'], verified?: boolean) =>
    request<Review>(`/api/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ status, ...(verified !== undefined ? { verified } : {}) }) }),
  deleteReview: (id: number) => request<{ ok: boolean }>(`/api/reviews/${id}`, { method: 'DELETE' }),

  trackClick: (productId: number | null, kind: 'view' | 'order' | 'favorite' | 'share' | 'whatsapp') =>
    request<{ ok: boolean }>('/api/analytics/click', { method: 'POST', body: JSON.stringify({ productId, kind }) }),
  getAnalyticsSummary: () => request<AnalyticsSummary>('/api/analytics/summary'),
  getAnalyticsClicks: () =>
    request<{ recent: { id: number; kind: string; productId: number | null; productName: string | null; dateAdded: string; kindLabel: string }[]; byProduct: Record<string, unknown>[] }>('/api/analytics/clicks'),

  getDashboardSummary: () => request<DashboardSummary>('/api/dashboard/summary'),
  getStatsDashboard: () => request<Record<string, unknown>>('/api/stats/dashboard'),

  getSuppliers: () => request<Record<string, unknown>[]>('/api/suppliers'),
  createSupplier: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: number) => request<{ ok: boolean }>(`/api/suppliers/${id}`, { method: 'DELETE' }),

  getPromotions: () => request<Record<string, unknown>[]>('/api/promotions'),
  createPromotion: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/promotions', { method: 'POST', body: JSON.stringify(data) }),
  updatePromotion: (id: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePromotion: (id: number) => request<{ ok: boolean }>(`/api/promotions/${id}`, { method: 'DELETE' }),

  getAnnouncements: () => request<Record<string, unknown>[]>('/api/announcements'),
  createAnnouncement: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id: number) => request<{ ok: boolean }>(`/api/announcements/${id}`, { method: 'DELETE' }),

  login: (password: string) =>
    request<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  verifyAuth: () => request<{ ok: boolean }>('/api/auth/me'),
};

export { API_URL };
