import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from './client';
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
  Settings,
  SettingsInput,
} from './types';

export const getGetProductsQueryKey = (params?: ProductsParams): QueryKey => [
  'products',
  params ?? {},
];
export const getGetCategoriesQueryKey = (search?: string): QueryKey => ['categories', search ?? ''];
export const getGetOrdersQueryKey = (): QueryKey => ['orders'];
export const getGetSettingsQueryKey = (): QueryKey => ['settings'];
export const getGetDashboardSummaryQueryKey = (): QueryKey => ['dashboard', 'summary'];
export const getGetReviewsQueryKey = (productId?: number): QueryKey => ['reviews', productId ?? null];
export const getGetAllReviewsQueryKey = (status?: string): QueryKey => ['reviews', 'all', status ?? ''];
export const getGetAnalyticsSummaryQueryKey = (): QueryKey => ['analytics', 'summary'];

export function useGetProducts(
  params?: ProductsParams,
  options?: { query?: UseQueryOptions<PaginatedProducts, Error, PaginatedProducts, QueryKey> },
) {
  return useQuery<PaginatedProducts, Error, PaginatedProducts, QueryKey>({
    queryKey: getGetProductsQueryKey(params),
    queryFn: () => api.getProducts(params),
    ...(options?.query ?? {}),
  });
}

export const getListProductsQueryKey = (params: Record<string, string | number | boolean | undefined> = {}): QueryKey => ['products', 'list', params];
export const getGetProductQueryKey = (id?: number | string): QueryKey => ['products', 'detail', id ?? 0];
export const getGetRelatedProductsQueryKey = (id?: number | string): QueryKey => ['products', 'related', id ?? 0];
export const getListReviewsQueryKey = (params?: { productId?: number; approved?: boolean; status?: string }): QueryKey => ['reviews', 'list', params ?? {}];
export const getListCategoriesQueryKey = (): QueryKey => ['categories', 'list'];
export const getListOrdersQueryKey = (params?: Record<string, string | number | boolean | undefined>): QueryKey => ['orders', 'list', params ?? {}];

export function useListProducts(
  params: Record<string, string | number | boolean | undefined> = {},
  options?: { query?: UseQueryOptions<{ items: Product[]; total: number }, Error, { items: Product[]; total: number }, QueryKey> },
) {
  return useQuery<{ items: Product[]; total: number }, Error, { items: Product[]; total: number }, QueryKey>({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => api.listProducts(params),
    ...(options?.query ?? {}),
  });
}

export function useGetProduct(
  id?: number | string,
  options?: { query?: UseQueryOptions<Product | undefined, Error, Product | undefined, QueryKey> },
) {
  return useQuery<Product | undefined, Error, Product | undefined, QueryKey>({
    queryKey: ['products', 'detail', id ?? 0],
    queryFn: () => (id != null ? api.getProduct(id) : undefined),
    enabled: id != null,
    ...(options?.query ?? {}),
  });
}

export function useListFeaturedProducts(
  params: { limit?: number } = {},
  options?: { query?: UseQueryOptions<Product[], Error, Product[], QueryKey> },
) {
  const limit = params.limit ?? 8;
  return useQuery<Product[], Error, Product[], QueryKey>({
    queryKey: ['products', 'featured', limit],
    queryFn: () => api.listFeaturedProducts(limit),
    ...(options?.query ?? {}),
  });
}

export function useListFlashSaleProducts(
  options?: { query?: UseQueryOptions<Product[], Error, Product[], QueryKey> },
) {
  return useQuery<Product[], Error, Product[], QueryKey>({
    queryKey: ['products', 'flash-sale'],
    queryFn: () => api.listFlashSaleProducts(10),
    ...(options?.query ?? {}),
  });
}

export function useListTopProducts(
  params: { limit?: number } = {},
  options?: { query?: UseQueryOptions<Product[], Error, Product[], QueryKey> },
) {
  const limit = params.limit ?? 8;
  return useQuery<Product[], Error, Product[], QueryKey>({
    queryKey: ['products', 'top', limit],
    queryFn: () => api.listTopProducts(limit),
    ...(options?.query ?? {}),
  });
}

export function useListHomeSections(
  params: { limit?: number } = {},
  options?: { query?: UseQueryOptions<HomeSections, Error, HomeSections, QueryKey> },
) {
  const limit = params.limit ?? 10;
  return useQuery<HomeSections, Error, HomeSections, QueryKey>({
    queryKey: ['products', 'home-sections', limit],
    queryFn: () => api.getHomeSections(limit),
    ...(options?.query ?? {}),
  });
}

export function useGetRelatedProducts(
  id?: number | string,
  options?: { query?: UseQueryOptions<Product[], Error, Product[], QueryKey> },
) {
  return useQuery<Product[], Error, Product[], QueryKey>({
    queryKey: ['products', 'related', id ?? 0],
    queryFn: () => (id != null ? api.getRelatedProducts(id) : []),
    enabled: id != null,
    ...(options?.query ?? {}),
  });
}

export interface RecommendedProducts {
  frequentlyBoughtTogether: Product[];
  mayAlsoLike: Product[];
}

export function useGetRecommendedProducts(
  id?: number | string,
  options?: { query?: UseQueryOptions<RecommendedProducts, Error, RecommendedProducts, QueryKey> },
) {
  return useQuery<RecommendedProducts, Error, RecommendedProducts, QueryKey>({
    queryKey: ['products', 'recommended', id ?? 0],
    queryFn: () => (id != null ? api.getRecommendedProducts(id) : { frequentlyBoughtTogether: [], mayAlsoLike: [] }),
    enabled: id != null,
    ...(options?.query ?? {}),
  });
}

export function useGetStatsDashboard() {
  return useQuery<Record<string, unknown>, Error, Record<string, unknown>, QueryKey>({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.getStatsDashboard(),
  });
}

export function useGetSuppliers() {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['suppliers'],
    queryFn: () => api.getSuppliers(),
  });
}

export function useGetPromotions() {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['promotions'],
    queryFn: () => api.getPromotions(),
  });
}

export function useListPromotions(
  options?: { query?: UseQueryOptions<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey> },
) {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['promotions'],
    queryFn: () => api.getPromotions(),
    ...(options?.query ?? {}),
  });
}

export const getListAnnouncementsQueryKey = (): QueryKey => ['announcements', 'list'];

export function useListAnnouncements(
  options?: { query?: UseQueryOptions<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey> },
) {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['announcements'],
    queryFn: () => api.getAnnouncements(),
    ...(options?.query ?? {}),
  });
}

export function useListSuppliers(
  options?: { query?: UseQueryOptions<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey> },
) {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['suppliers'],
    queryFn: () => api.getSuppliers(),
    ...(options?.query ?? {}),
  });
}

export function useGetDashboardStats() {
  return useQuery<Record<string, unknown>, Error, Record<string, unknown>, QueryKey>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.getStatsDashboard(),
  });
}

export function useGetOrdersByStatus() {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['dashboard', 'orders-by-status'],
    queryFn: () => api.getStatsDashboard().then((d: any) => d.ordersByStatus ?? []),
  });
}

export function useGetTopProducts(
  params: { limit?: number } = {},
  options?: { query?: UseQueryOptions<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey> },
) {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['dashboard', 'top-products', params.limit ?? 5],
    queryFn: () => api.getStatsDashboard().then((d: any) => (d.topProducts ?? []).slice(0, params.limit ?? 5)),
    ...(options?.query ?? {}),
  });
}

export function useGetRecentOrders(
  params: { limit?: number } = {},
  options?: { query?: UseQueryOptions<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey> },
) {
  return useQuery<Record<string, unknown>[], Error, Record<string, unknown>[], QueryKey>({
    queryKey: ['dashboard', 'recent-orders', params.limit ?? 5],
    queryFn: () => api.getStatsDashboard().then((d: any) => (d.recentOrders ?? []).slice(0, params.limit ?? 5)),
    ...(options?.query ?? {}),
  });
}

export function useGetCategories(search?: string) {
  return useQuery<Category[], Error, Category[], QueryKey>({
    queryKey: getGetCategoriesQueryKey(search),
    queryFn: () => api.getCategories(search),
  });
}

export function useGetCategoryBySlug(slug?: string) {
  return useQuery<Category, Error, Category, QueryKey>({
    queryKey: ['categories', 'slug', slug ?? ''],
    queryFn: () => api.getCategoryBySlug(slug as string),
    enabled: Boolean(slug),
  });
}

export function useListCategories(
  options?: { query?: UseQueryOptions<Category[], Error, Category[], QueryKey> },
) {
  return useQuery<Category[], Error, Category[], QueryKey>({
    queryKey: getListCategoriesQueryKey(),
    queryFn: () => api.getCategories(),
    ...(options?.query ?? {}),
  });
}

export function useListReviews(
  params: { productId?: number; approved?: boolean; status?: string } = {},
  options?: { query?: UseQueryOptions<Review[], Error, Review[], QueryKey> },
) {
  return useQuery<Review[], Error, Review[], QueryKey>({
    queryKey: getListReviewsQueryKey(params),
    queryFn: () => {
      let url = '/api/reviews';
      const qp = new URLSearchParams();
      if (params.productId != null) qp.set('pageNum', String(params.productId));
      if (params.status) qp.set('status', params.status);
      if (params.approved && !params.status) qp.set('status', 'approved');
      const qs = qp.toString();
      if (qs) url += `?${qs}`;
      return api.getReviews(params.productId);
    },
    ...(options?.query ?? {}),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReviewInput) => api.createReview(data),
    onSuccess: (_review, variables) => {
      qc.invalidateQueries({ queryKey: getListReviewsQueryKey({ productId: variables.productId }) });
    },
  });
}

export function useListOrders(
  params: Record<string, string | number | boolean | undefined> = {},
  options?: { query?: UseQueryOptions<Order[], Error, Order[], QueryKey> },
) {
  return useQuery<Order[], Error, Order[], QueryKey>({
    queryKey: getListOrdersQueryKey(params),
    queryFn: () => api.listOrders(params),
    ...(options?.query ?? {}),
  });
}

export function useGetOrders() {
  return useQuery<Order[], Error, Order[], QueryKey>({
    queryKey: getGetOrdersQueryKey(),
    queryFn: () => api.getOrders(),
  });
}

export function useGetSettings() {
  return useQuery<Settings, Error, Settings, QueryKey>({
    queryKey: getGetSettingsQueryKey(),
    queryFn: () => api.getSettings(),
  });
}

export function useGetDashboardSummary() {
  return useQuery<DashboardSummary, Error, DashboardSummary, QueryKey>({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: () => api.getDashboardSummary(),
  });
}

export function useGetReviews(productId?: number) {
  return useQuery<Review[], Error, Review[], QueryKey>({
    queryKey: getGetReviewsQueryKey(productId),
    queryFn: () => api.getReviews(productId),
  });
}

export function useGetAllReviews(status: 'approved' | 'pending' | 'rejected' = 'pending') {
  return useQuery<Review[], Error, Review[], QueryKey>({
    queryKey: getGetAllReviewsQueryKey(status),
    queryFn: () => api.getAllReviews(status),
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; status?: Review['status']; verified?: boolean; data?: Partial<Review> }) => {
      const id = vars.id;
      if (vars.data && 'approved' in vars.data) {
        return api.updateReview(id, vars.data.approved ? 'approved' : 'pending', vars.verified);
      }
      return api.updateReview(id, vars.status ?? (vars.data?.status as Review['status'] | undefined) ?? 'pending', vars.verified ?? vars.data?.verified);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => api.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useGetAnalyticsSummary() {
  return useQuery<AnalyticsSummary, Error, AnalyticsSummary, QueryKey>({
    queryKey: getGetAnalyticsSummaryQueryKey(),
    queryFn: () => api.getAnalyticsSummary(),
  });
}

export const getGetAnalyticsClicksQueryKey = (): QueryKey => ['analytics', 'clicks'];

export function useGetAnalyticsClicks() {
  return useQuery<{ recent: { id: number; kind: string; productId: number | null; productName: string | null; dateAdded: string; kindLabel: string }[]; byProduct: Record<string, unknown>[] }, Error, { recent: { id: number; kind: string; productId: number | null; productName: string | null; dateAdded: string; kindLabel: string }[]; byProduct: Record<string, unknown>[] }, QueryKey>({
    queryKey: getGetAnalyticsClicksQueryKey(),
    queryFn: () => api.getAnalyticsClicks(),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: ProductInput }) => api.createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductInput }) => api.updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => api.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: CategoryInput }) => api.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryInput }) => api.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => api.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: SettingsInput }) => api.updateSettings(data),
    onSuccess: (saved) => {
      qc.setQueryData<Settings>(getGetSettingsQueryKey(), saved);
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Order> & { items?: { productId: number; quantity: number }[] }) =>
      api.createOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Order> }) => api.updateOrder(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Record<string, unknown> }) => api.createSupplier(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.updateSupplier(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => api.deleteSupplier(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Record<string, unknown> }) => api.createPromotion(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.updatePromotion(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => api.deletePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Record<string, unknown> }) => api.createAnnouncement(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.updateAnnouncement(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => api.deleteAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}
