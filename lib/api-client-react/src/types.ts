export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  categoryId?: number | null;
  categoryName?: string | null;
  brand?: string;
  price: number;
  oldPrice?: number;
  finalPrice?: number;
  calculatedPrice?: number;
  roundingRule?: 'none' | '500' | '1000' | string;
  originalPrice?: number;
  discountPercent?: number;
  promoPrice?: number | null;
  promoDiscountPercent?: number;
  promoName?: string | null;
  promoId?: number | null;
  promoType?: 'product' | 'category' | string | null;
  supplierPrice?: number | null;
  marginPercent?: number | null;
  supplierId?: number | null;
  supplierName?: string | null;
  description: string;
  details: string[];
  images: string[];
  status: 'available' | 'unavailable';
  available: boolean;
  featured: boolean;
  isFlashSale?: boolean;
  flashSaleEndsAt?: string | null;
  badge?: string;
  stock: number;
  stockQuantity?: number;
  stockStatus?: 'available' | 'low' | 'out' | string;
  tags: string[];
  keywords: string[];
  deliveryCities: string[];
  deliveryInfo?: string;
  warrantyInfo?: string;
  specifications?: string;
  averageRating?: number | null;
  reviewCount?: number;
  viewCount?: number;
  orderCount?: number;
  dateAdded: string;
  createdAt?: string;
};

export type ProductInput = {
  name: string;
  category: string;
  price: number;
  status?: 'available' | 'unavailable';
  description?: string;
  details?: string[];
  images?: string[];
  oldPrice?: number;
  featured?: boolean;
  badge?: string;
  stock?: number;
  tags?: string[];
  keywords?: string[];
  deliveryCities?: string[];
  brand?: string;
  supplierPrice?: number | null;
  marginPercent?: number | null;
  supplierId?: number | null;
  deliveryInfo?: string;
  warrantyInfo?: string;
  specifications?: string;
  isFlashSale?: boolean;
  flashSaleEndsAt?: string | null;
};

export type Category = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  images?: string[];
  icon: string;
  marginPercent?: number;
  status: 'active' | 'inactive';
  productCount: number;
  dateAdded: string;
};

export type CategoryInput = {
  name: string;
  status?: 'active' | 'inactive';
  icon?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  images?: string[];
  marginPercent?: number;
};

export type Announcement = {
  id: number;
  title: string;
  body?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  bgColor?: string;
  textColor?: string;
  active?: boolean;
  sortOrder?: number;
  dateAdded?: string;
};

export type AnnouncementInput = {
  title: string;
  body?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  bgColor?: string;
  textColor?: string;
  active?: boolean;
  sortOrder?: number;
};

export type Order = {
  id: number;
  customer: string;
  customerName?: string;
  phone: string;
  customerPhone?: string;
  products: string;
  productName?: string;
  amount: number;
  totalPrice?: number;
  quantity?: number;
  whatsappMessage?: string | null;
  status: 'new' | 'pending' | 'processed' | string;
  date: string;
  source: 'web' | 'whatsapp';
};

export type OrderPatchStatus = 'new' | 'contacted' | 'reserved' | 'retrieved' | 'delivering' | 'delivered' | 'cancelled' | string;

export type Settings = {
  storeName: string;
  logo: string | null;
  whatsapp: string;
  description: string;
  adminName: string;
  adminEmail: string;
  accentColor: string;
  heroEnabled: boolean;
  heroImage: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroCtaText: string | null;
  announcement: string | null;
  roundingRule?: 'none' | '500' | '1000' | string;
  sellingMinProducts?: number;
  popularMinProducts?: number;
  popularViewThreshold?: number;
  whatsappMinProducts?: number;
  whatsappClickThreshold?: number;
};

export type SettingsInput = {
  storeName?: string;
  logo?: string | null;
  whatsapp?: string;
  description?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
  accentColor?: string;
  heroEnabled?: boolean;
  heroImage?: string | null;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroCtaText?: string | null;
  announcement?: string | null;
  roundingRule?: 'none' | '500' | '1000' | string;
  sellingMinProducts?: number;
  popularMinProducts?: number;
  popularViewThreshold?: number;
  whatsappMinProducts?: number;
  whatsappClickThreshold?: number;
};

export type Review = {
  id: number;
  productId: number;
  productName: string | null;
  author: string;
  authorName?: string;
  rating: number;
  comment: string;
  approved?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  image?: string | null;
  verified?: boolean;
  dateAdded: string;
};

export type ReviewInput = {
  productId: number;
  author: string;
  rating: number;
  comment: string;
};

export type AnalyticsSummary = {
  totals: {
    view: number;
    view_week: number;
    order: number;
    order_week: number;
    favorite: number;
    favorite_week: number;
    share: number;
    share_week: number;
  };
  topOrders: { productId: number | null; name: string | null; count: number }[];
  pendingReviews: number;
};

export type DashboardSummary = {
  productCount: number;
  availableProductCount: number;
  categoryCount: number;
  orderCount: number;
  recentProducts: Product[];
};

export type PaginatedProducts = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export type HomeSections = {
  topSold: Product[];
  soldVisible: boolean;
  topViewed: Product[];
  popularVisible: boolean;
  topWhatsapp: Product[];
  whatsappVisible: boolean;
  thresholds: {
    sellingMinProducts: number;
    popularMinProducts: number;
    popularViewThreshold: number;
    whatsappMinProducts: number;
    whatsappClickThreshold: number;
  };
};

export type ProductsParams = {
  search?: string;
  category?: string;
  status?: 'available' | 'unavailable' | string;
  stockStatus?: 'in' | 'out' | string;
  sort?: string;
  page?: number;
  limit?: number;
};
