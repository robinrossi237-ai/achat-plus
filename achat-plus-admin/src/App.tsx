import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  ArrowRight, Ban, Box, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleCheck, Copy, Grid2X2, Headphones, Heart, LayoutDashboard,
  Loader2, LogOut, Megaphone, Menu, MessageCircle, MessageSquare, Minus, Pencil, Percent, Plus, RefreshCcw, Search, Settings as SettingsIcon, Share2, Star, Tag, ThumbsUp,
  Trash2, TrendingUp, Truck, UploadCloud, UserRound, X, Zap, Eye,
} from 'lucide-react';
import {
  api, authToken, getGetAllReviewsQueryKey, getGetAnalyticsSummaryQueryKey, getGetCategoriesQueryKey,
  getGetDashboardSummaryQueryKey, getGetProductsQueryKey, getGetSettingsQueryKey,
  setOnUnauthorized, useCreateCategory, useCreateProduct, useCreatePromotion, useCreateSupplier,
  useDeleteCategory, useDeleteProduct, useDeletePromotion, useDeleteReview, useDeleteSupplier,
  useGetAllReviews, useGetAnalyticsClicks, useGetAnalyticsSummary, useGetCategories, useGetDashboardSummary, useGetProducts,
  useGetPromotions, useGetSettings, useGetSuppliers, useUpdateCategory, useUpdateProduct, useUpdatePromotion,
  useUpdateReview, useUpdateSettings, useUpdateSupplier,
  useCreateAnnouncement, useDeleteAnnouncement, useListAnnouncements, useUpdateAnnouncement,
  type Announcement, type AnnouncementInput,
  type Category, type CategoryInput, type Product, type ProductInput, type Review, type SettingsInput,
} from '@workspace/api-client-react';
import logo from '@assets/ACHAT+_LOGO_1787770111512.png';
import { ErrorBoundary } from '@/components/error-boundary';
import { Form } from '@/components/ui/form';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';

const queryClient = new QueryClient();
const PUBLIC_STORE_URL = (import.meta.env.VITE_PUBLIC_URL as string | undefined) || '/';
const money = (value: number) => new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

function StatusBadge({ status }: { status: string }) {
  const available = ['available', 'active', 'new', 'processed'].includes(status);
  const text: Record<string, string> = { available: 'Disponible', unavailable: 'Indisponible', active: 'Active', inactive: 'Inactive', new: 'Nouveau', pending: 'En attente', processed: 'Traité' };
  return <span data-testid={`status-${status}`} className={`status-badge ${available ? 'status-good' : status === 'pending' ? 'status-warm' : 'status-bad'}`}><span className="status-dot" />{text[status] ?? status}</span>;
}

function SkeletonRows({ count = 5 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <div className="skeleton-row" key={i}><div className="skeleton skeleton-thumb" /><div className="skeleton skeleton-line wide" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line" /></div>)}</>;
}

function EmptyState({ icon: Icon = Box, title, detail, action }: { icon?: typeof Box; title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={24} /></div><strong>{title}</strong><p>{detail}</p>{action}</div>;
}

function AdminShell({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { data: settings } = useGetSettings();
  const whatsapp = settings?.whatsapp || '237677420606';
  const adminName = settings?.adminName || 'Administrateur';
  const adminEmail = settings?.adminEmail || 'admin@achatplus.com';
  const nav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products', label: 'Produits', icon: Box },
    { href: '/categories', label: 'Catégories', icon: Grid2X2 },
    { href: '/suppliers', label: 'Fournisseurs', icon: Truck },
    { href: '/promotions', label: 'Promotions', icon: Tag },
    { href: '/announcements', label: 'Bandeaux', icon: Megaphone },
    { href: '/reviews', label: 'Avis clients', icon: MessageSquare },
    { href: '/settings', label: 'Paramètres', icon: SettingsIcon },
  ];
  const current = nav.find((item) => location.startsWith(item.href))?.label ?? 'Dashboard';
  return <div className="app-frame">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="brand-lockup"><img src={logo} alt="ACHAT+" /><button data-testid="button-close-menu" className="mobile-close" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
      <nav className="main-nav" aria-label="Navigation principale">
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-${label.toLowerCase()}`} className={`nav-item ${location.startsWith(href) ? 'active' : ''}`} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}><Icon size={18} strokeWidth={1.8} />{!collapsed && <span>{label}</span>}</Link>)}
      </nav>
      <div className="sidebar-bottom">
        {!collapsed && <div className="help-card"><div className="help-title"><Headphones size={18} />Besoin d'aide ?</div><p>Contactez-nous sur<br />WhatsApp</p><a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" data-testid="link-whatsapp" className="help-button">Nous contacter</a></div>}
        {!collapsed && <div className="profile-card"><div className="avatar orange"><UserRound size={17} /></div><div className="profile-copy"><strong>{adminName}</strong><span>{adminEmail}</span></div><ChevronDown size={15} /></div>}
        {collapsed && <div className="profile-card collapsed-profile"><div className="avatar orange"><UserRound size={17} /></div></div>}
      </div>
    </aside>
    {mobileOpen && <button data-testid="button-mobile-overlay" className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" />}
    <div className="main-column">
      <header className="topbar"><button data-testid="button-menu" className="icon-button menu-button" onClick={() => { if (window.innerWidth > 768) setCollapsed(!collapsed); else setMobileOpen(true); }}><Menu size={20} /></button><div className="topbar-spacer" /><a className="topbar-store-link" href={PUBLIC_STORE_URL} target="_blank" rel="noreferrer" data-testid="link-view-store" title="Ouvrir la boutique publique"><Eye size={15} /> Voir la boutique</a><div className="account-wrap"><button data-testid="button-account-menu" className="account-button" onClick={() => setAccountOpen((value) => !value)}><div className="avatar orange"><UserRound size={17} /></div><span>{adminName}</span><ChevronDown size={14} /></button>{accountOpen && <div className="account-menu"><strong>{adminName}</strong><small>{adminEmail}</small><button onClick={() => { setAccountOpen(false); onLogout(); }} data-testid="button-logout"><LogOut size={14} /> Se déconnecter</button><button onClick={() => setAccountOpen(false)} data-testid="button-close-account">Fermer le menu</button></div>}</div></header>
      <main className="page-content page-enter"><div className="page-eyebrow">{current}</div>{children}</main>
    </div>
    <CommandPalette onNavigate={() => setMobileOpen(false)} />
  </div>;
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function QueryError({ retry }: { retry: () => void }) {
  return <div className="error-state"><CircleAlert size={22} /><div><strong>Impossible de charger ces données</strong><p>Vérifiez votre connexion puis réessayez.</p></div><button className="button button-secondary" onClick={retry} data-testid="button-retry"><RefreshCcw size={15} /> Réessayer</button></div>;
}

function CommandPalette({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [query, setQuery] = useState('');
  const [, setLocation] = useLocation();
  const pages = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/products', label: 'Produits', icon: Box },
    { href: '/categories', label: 'Catégories', icon: Grid2X2 },
    { href: '/suppliers', label: 'Fournisseurs', icon: Truck },
    { href: '/promotions', label: 'Promotions', icon: Tag },
    { href: '/announcements', label: 'Bandeaux', icon: Megaphone },
    { href: '/reviews', label: 'Avis clients', icon: MessageSquare },
    { href: '/settings', label: 'Paramètres', icon: SettingsIcon },
  ];
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setQuery(raw.trim()), 180);
    return () => window.clearTimeout(timer);
  }, [raw, open]);
  const searchParams = useMemo(() => (open && query ? { search: query, limit: 8 } : undefined), [open, query]);
  const productsQuery = useGetProducts(searchParams, { query: { enabled: Boolean(searchParams), queryKey: getGetProductsQueryKey(searchParams) } });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen((value) => !value); setRaw(''); setQuery(''); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const go = (href: string) => { setOpen(false); setRaw(''); setQuery(''); setLocation(href); onNavigate(); };
  const pageResults = pages.filter((page) => page.label.toLowerCase().includes(query.toLowerCase()) || page.href.includes(query.toLowerCase()));
  const products = productsQuery.data?.items ?? [];
  if (!open) return null;
  return <div className="palette-backdrop" onMouseDown={() => setOpen(false)} data-testid="command-palette">
    <div className="palette" onMouseDown={(event) => event.stopPropagation()}>
      <div className="palette-search"><Search size={17} /><input data-testid="input-command-palette" placeholder="Rechercher une page ou un produit… (Échap pour fermer)" value={raw} onChange={(event) => setRaw(event.target.value)} autoFocus autoComplete="off" /></div>
      <div className="palette-results">
        <p className="palette-group">Navigation</p>
        {pageResults.length === 0 && query ? <p className="palette-empty">Aucune page ne correspond à « {query} ».</p> : pageResults.map(({ href, label, icon: Icon }) => <button key={href} className="palette-item" onClick={() => go(href)} data-testid={`palette-page-${label.toLowerCase()}`}><Icon size={16} /><span>{label}</span></button>)}
        {query.trim() && <p className="palette-group">Produits</p>}
        {productsQuery.isLoading && query ? <p className="palette-empty">Recherche…</p> : products.length === 0 && query ? <p className="palette-empty">Aucun produit ne correspond à « {query} ».</p> : products.map((product) => <button key={product.id} className="palette-item" onClick={() => go(`/products/${product.id}/edit`)} data-testid={`palette-product-${product.id}`}>{product.images?.[0] ? <img src={product.images[0]} alt="" className="palette-thumb" /> : <span className="palette-thumb palette-thumb-fallback">{initials(product.name)}</span>}<span className="palette-product-name">{product.name}</span><small>{money(product.finalPrice)}</small></button>)}
        <kbd className="palette-kbd">⌘K pour ouvrir</kbd>
      </div>
    </div>
  </div>;
}

function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const analyticsQuery = useGetAnalyticsSummary();
  const { data: settings } = useGetSettings();
  const adminName = settings?.adminName || 'Administrateur';
  const summary = summaryQuery.data;
  const analytics = analyticsQuery.data;
  const metrics = [
    { label: 'Produits', value: summary?.productCount ?? 0, note: 'Total des produits', icon: Box, tone: 'orange' },
    { label: 'Produits disponibles', value: summary?.availableProductCount ?? 0, note: 'Produits visibles', icon: CircleCheck, tone: 'green' },
    { label: 'Catégories', value: summary?.categoryCount ?? 0, note: 'Total des catégories', icon: Tag, tone: 'violet' },
    { label: 'Demandes WhatsApp', value: analytics?.totals.order ?? 0, note: 'Commandes lancées', icon: MessageCircle, tone: 'green' },
    { label: 'Vues produits', value: analytics?.totals.view ?? 0, note: 'Consultations publiques', icon: Eye, tone: 'blue' },
    { label: 'Avis en attente', value: analytics?.pendingReviews ?? 0, note: 'À modérer', icon: MessageSquare, tone: 'violet' },
  ];
  return <><PageHeader title="Dashboard" description={`Bonjour ${adminName}, voici un aperçu de votre boutique.`} /><section className="metric-grid">{metrics.map(({ label, value, note, icon: Icon, tone }) => <div className="metric-card" key={label}><div className={`metric-icon ${tone}`}><Icon size={20} /></div><div className="metric-label">{label}</div><strong data-testid={`metric-${label}`}>{summaryQuery.isLoading || analyticsQuery.isLoading ? <span className="skeleton metric-skeleton" /> : value}</strong><span className="metric-note">{note}</span></div>)}</section><section className="panel demand-panel"><div className="panel-heading"><div><h2>Demandes WhatsApp</h2><p>Les clics « Négocier le prix » et « Poser une question » provenant de la boutique publique</p></div><Link href="/reviews" data-testid="link-reviews" className="button button-outline">{analyticsQuery.data?.pendingReviews ? `${analyticsQuery.data.pendingReviews} avis à modérer` : 'Modérer les avis'} <ArrowRight size={15} /></Link></div>{analyticsQuery.isLoading ? <SkeletonRows count={3} /> : analyticsQuery.isError ? <QueryError retry={() => analyticsQuery.refetch()} /> : (analytics?.totals.order ?? 0) === 0 && (analytics?.totals.view ?? 0) === 0 ? <EmptyState icon={MessageCircle} title="Aucune donnée pour le moment" detail="Les interactions de vos visiteurs apparaîtront ici dès que la boutique sera consultée." /> : <><div className="demand-stats"><div className="demand-stat"><span className="demand-stat-icon green"><MessageCircle size={18} /></span><strong>{analytics!.totals.order}</strong><small>commandes lancées</small></div><div className="demand-stat"><span className="demand-stat-icon blue"><Eye size={18} /></span><strong>{analytics!.totals.view}</strong><small>vues produits</small></div><div className="demand-stat"><span className="demand-stat-icon orange"><Heart size={18} /></span><strong>{analytics!.totals.favorite}</strong><small>favoris</small></div><div className="demand-stat"><span className="demand-stat-icon violet"><Share2 size={18} /></span><strong>{analytics!.totals.share}</strong><small>partages</small></div></div>{analytics!.totals.order_week > 0 && <p className="demand-week">Cette semaine : <strong>{analytics!.totals.order_week}</strong> commande{analytics!.totals.order_week > 1 ? 's' : ''} lancée{analytics!.totals.order_week > 1 ? 's' : ''} · <strong>{analytics!.totals.view_week}</strong> vue{analytics!.totals.view_week > 1 ? 's' : ''}</p>}{(analytics!.topOrders?.length ?? 0) > 0 && <div className="top-demand"><strong className="top-demand-title">Produits les plus demandés</strong>{analytics!.topOrders.slice(0, 5).map((item, index) => <div className="top-demand-row" key={`${item.productId}-${index}`}><span>{item.name ?? `Produit #${item.productId ?? '?'}`}</span><span className="top-demand-count">{item.count} demande{item.count > 1 ? 's' : ''}</span></div>)}</div>}</>}</section><section className="panel recent-panel"><div className="panel-heading"><div><h2>Produits récemment ajoutés</h2><p>Les dernières références de votre catalogue</p></div><Link href="/products" data-testid="link-all-products" className="button button-outline">Voir tous les produits <ArrowRight size={15} /></Link></div>{summaryQuery.isLoading ? <SkeletonRows count={4} /> : summaryQuery.isError ? <QueryError retry={() => summaryQuery.refetch()} /> : (summary?.recentProducts?.length ?? 0) === 0 ? <EmptyState icon={Box} title="Aucun produit pour le moment" detail="Ajoutez votre première référence pour commencer." action={<Link href="/products/new" className="button button-primary">Ajouter un produit</Link>} /> : <ProductTable products={summary!.recentProducts} compact />}</section></>;
}

function ProductThumb({ product }: { product: Product }) {
  return product.images?.[0] ? <img className="product-thumb" src={product.images[0]} alt="" /> : <div className="product-thumb thumb-fallback">{initials(product.name)}</div>;
}

function DemandDetails() {
  const clicksQuery = useGetAnalyticsClicks();
  const byProduct = (clicksQuery.data?.byProduct ?? []) as { productId: number; name: string; orders: number; whatsapp: number; views: number; favorites: number; shares: number; total: number }[];
  const recent = clicksQuery.data?.recent ?? [];
  const kindColors: Record<string, string> = { 'Commande lancée': 'good', 'Contact WhatsApp': 'good', 'Vue produit': 'blue', 'Favori': 'warm', 'Partage': 'blue' };
  return <>{clicksQuery.isLoading ? <section className="panel table-panel"><SkeletonRows count={4} /></section> : clicksQuery.isError ? <QueryError retry={() => clicksQuery.refetch()} /> : clicksQuery.data && (recent.length > 0 || byProduct.length > 0) ? <section className="panel table-panel demand-detail">
    <div className="panel-heading"><div><h2>Produits les plus demandés</h2><p>Classement des produits ayant généré le plus de clics « Commande » / « WhatsApp » sur la boutique</p></div></div>
    {byProduct.length === 0 ? <EmptyState icon={MessageCircle} title="Aucun produit demandé" detail="Les interactions apparaîtront dès que vos visiteurs cliqueront sur « Négocier le prix » ou « Commander via WhatsApp »." /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Produit</th><th>Commandes</th><th>WhatsApp</th><th>Vues</th><th>Favoris</th><th>Total</th></tr></thead><tbody>{byProduct.map((row) => <tr key={row.productId} data-testid={`demand-product-${row.productId}`}><td><div className="product-cell"><strong>{row.name}</strong></div></td><td><span className="status-badge status-good">{row.orders}</span></td><td><span className="status-badge status-warm">{row.whatsapp}</span></td><td className="muted-cell">{row.views}</td><td className="muted-cell">{row.favorites}</td><td><strong>{row.total}</strong></td></tr>)}</tbody></table></div>}
    <div className="demand-recent"><div className="panel-heading"><div><h2>Dernières interactions</h2><p>Les 100 derniers clics enregistrés</p></div></div><div className="demand-recent-list">{recent.slice(0, 40).map((row) => <div className={`demand-recent-row status-${kindColors[row.kindLabel] || 'muted'}`} key={row.id} data-testid={`demand-recent-${row.id}`}><span className="status-dot" /><div><strong>{row.productName || 'Page d\'accueil'}</strong><small>{row.kindLabel} · {new Date(row.dateAdded + 'Z').toLocaleString('fr-FR')}</small></div></div>)}</div></div>
  </section> : null}</>;
}

function ProductTable({ products, compact = false, onDelete, onDuplicate, selected, onToggleSelect, onToggleSelectAll }: { products: Product[]; compact?: boolean; onDelete?: (product: Product) => void; onDuplicate?: (product: Product) => void; selected?: Set<number>; onToggleSelect?: (id: number) => void; onToggleSelectAll?: (ids: number[]) => void }) {
  const stockMutation = useUpdateProduct();
  const qc = useQueryClient();
  const changeStock = (product: Product, delta: number) => {
    stockMutation.mutate(
      { id: product.id, data: { ...product, stock: Math.max(0, (product.stock ?? 0) + delta) } },
      {
        onSuccess: () => { qc.invalidateQueries({ queryKey: getGetProductsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); toast({ title: 'Stock mis à jour' }); },
      },
    );
  };
  return <div className="table-scroll"><table className="data-table"><thead><tr>{onToggleSelectAll && <th className="checkbox-cell"><input type="checkbox" data-testid="select-all-products" checked={(products.length > 0 && (selected?.size ?? 0) === products.length)} onChange={() => onToggleSelectAll(products.map((p) => p.id))} aria-label="Tout sélectionner" /></th>}<th>Produit</th><th>Catégorie</th><th>Prix</th><th>Statut</th><th>Stock</th><th>Date d'ajout</th>{!compact && <th className="align-right">Actions</th>}</tr></thead><tbody>{products.map((product) => <tr key={product.id} data-testid={`row-product-${product.id}`}>{onToggleSelect && <td className="checkbox-cell"><input type="checkbox" checked={selected?.has(product.id) ?? false} onChange={() => onToggleSelect(product.id)} aria-label={`Sélectionner ${product.name}`} data-testid={`select-product-${product.id}`} /></td>}<td><div className="product-cell"><ProductThumb product={product} /><strong>{product.name}</strong></div></td><td className="muted-cell">{product.category}</td><td>{money(product.price)}</td><td><StatusBadge status={product.status} /></td><td><div className="inline-stock" data-testid={`stock-control-${product.id}`}><button className="stock-btn" onClick={() => changeStock(product, -1)} disabled={stockMutation.isPending || (product.stock ?? 0) <= 0} aria-label={`Réduire le stock de ${product.name}`} data-testid={`stock-minus-${product.id}`}><Minus size={13} /></button><span className={`stock-value ${product.stock === 0 ? 'stock-zero' : product.stock <= 3 ? 'stock-low' : 'stock-ok'}`} data-testid={`text-stock-${product.id}`}>{product.stock ?? 0}</span><button className="stock-btn" onClick={() => changeStock(product, 1)} disabled={stockMutation.isPending} aria-label={`Augmenter le stock de ${product.name}`} data-testid={`stock-plus-${product.id}`}><Plus size={13} /></button></div>{product.stock === 0 ? <span className="status-badge status-bad stock-note">Rupture</span> : product.stock <= 3 ? <span className="stock-note warm">Plus que {product.stock}</span> : null}</td><td className="muted-cell">{date(product.dateAdded)}</td>{!compact && <td><div className="row-actions"><Link href={`/products/${product.id}/edit`} className="action-button edit" data-testid={`button-edit-product-${product.id}`}><Pencil size={15} /></Link><button className="action-button copy" onClick={() => onDuplicate?.(product)} title="Dupliquer le produit" aria-label={`Dupliquer ${product.name}`} data-testid={`button-duplicate-product-${product.id}`}><Copy size={15} /></button><button className="action-button delete" onClick={() => onDelete?.(product)} data-testid={`button-delete-product-${product.id}`}><Trash2 size={15} /></button></div></td>}</tr>)}</tbody></table></div>;
}

function Products() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const params = useMemo(() => ({ ...(search ? { search } : {}), ...(category ? { category } : {}), ...(status ? { status: status as 'available' | 'unavailable' } : {}), ...(outOfStockOnly ? { stockStatus: 'out' as const } : {}), ...(sort ? { sort } : {}), page, limit: 12 }), [search, category, status, outOfStockOnly, sort, page]);
  const query = useGetProducts(params);
  const catsQuery = useGetCategories();
  const deleteMutation = useDeleteProduct();
  const duplicateMutation = useCreateProduct();
  const qc = useQueryClient();
  const toggleSelect = (id: number) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleSelectAll = (ids: number[]) => setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  const runBulk = async (action: 'unavailable' | 'out' | 'delete') => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const items = query.data?.items ?? [];
    try {
      await Promise.all(ids.map((id) => {
        const p = items.find((i) => i.id === id);
        if (!p) return Promise.resolve();
        if (action === 'delete') return api.deleteProduct(id).then(() => undefined);
        const data = action === 'out' ? { ...p, stock: 0 } : { ...p, status: 'unavailable' as const };
        return api.updateProduct(id, data).then(() => undefined);
      }));
      qc.invalidateQueries({ queryKey: getGetProductsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      setSelected(new Set());
      toast({ title: action === 'delete' ? `${ids.length} produit(s) supprimé(s)` : action === 'out' ? `${ids.length} produit(s) passé(s) en rupture` : `${ids.length} produit(s) indisponible(s)` });
    } catch {
      toast({ title: 'Échec de l\'action groupée', variant: 'destructive' });
    }
  };
  const reset = () => { setSearch(''); setCategory(''); setStatus(''); setOutOfStockOnly(false); setSort(''); setPage(1); setSelected(new Set()); };
  const totalPages = query.data?.pageCount ?? 1;
  const remove = () => { if (!deleteTarget) return; deleteMutation.mutate({ id: deleteTarget.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetProductsQueryKey() }); setDeleteTarget(null); toast({ title: 'Produit supprimé' }); }, onError: () => toast({ title: 'Échec de la suppression du produit', variant: 'destructive' }) }); };
  const duplicate = (product: Product) => { duplicateMutation.mutate({ data: { ...product, name: `${product.name} — copie` } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetProductsQueryKey() }); toast({ title: 'Produit dupliqué' }); }, onError: () => toast({ title: 'Échec de la duplication du produit', variant: 'destructive' }) }); };
  return <><PageHeader title="Produits" description="Gérez tous vos produits (ajouter, modifier ou supprimer)." action={<Link href="/products/new" data-testid="button-add-product" className="button button-primary"><Plus size={16} /> Ajouter un produit</Link>} /><section className="panel table-panel"><div className="filter-bar"><label className="search-field"><Search size={17} /><input data-testid="input-product-search" placeholder="Rechercher un produit..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label><select data-testid="select-product-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">Toutes catégories</option>{catsQuery.data?.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select><select data-testid="select-product-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Tous statuts</option><option value="available">Disponible</option><option value="unavailable">Indisponible</option></select><label className="rupture-toggle" data-testid="toggle-rupture" title="Filtrer les produits en rupture de stock"><input type="checkbox" checked={outOfStockOnly} onChange={(event) => { setOutOfStockOnly(event.target.checked); setPage(1); }} aria-label="Produits en rupture" />En rupture</label><select data-testid="select-product-sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label="Trier les produits"><option value="">Trier par</option><option value="price_asc">Prix croissant</option><option value="price_desc">Prix décroissant</option><option value="stock_asc">Stock croissant</option><option value="stock_desc">Stock décroissant</option><option value="date_desc">Plus récents</option><option value="date_asc">Plus anciens</option></select><button data-testid="button-reset-products" onClick={reset} className="button button-outline reset-button"><RefreshCcw size={14} /> Réinitialiser</button></div>{query.isLoading ? <SkeletonRows count={12} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : (query.data?.items.length ?? 0) === 0 ? <EmptyState icon={Search} title="Aucun produit trouvé" detail="Essayez une autre recherche ou ajoutez un nouveau produit." action={<Link href="/products/new" className="button button-primary">Ajouter un produit</Link>} /> : <><ProductTable products={query.data!.items} onDelete={setDeleteTarget} onDuplicate={duplicate} selected={selected} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} />{selected.size > 0 && <div className="bulk-bar" data-testid="bulk-bar"><span className="bulk-count">{selected.size} produit(s) sélectionné(s)</span><button className="button button-outline button-small" onClick={() => runBulk('unavailable')} data-testid="bulk-unavailable">Rendre indisponible</button><button className="button button-outline button-small" onClick={() => runBulk('out')} data-testid="bulk-out">Mettre en rupture</button><button className="button button-danger button-small" onClick={() => runBulk('delete')} data-testid="bulk-delete"><Trash2 size={13} /> Supprimer</button><button className="button button-outline button-small" onClick={() => setSelected(new Set())}>Annuler</button></div>}<div className="table-footer"><span>Affichage de {query.data!.items.length} sur {query.data!.total} produits</span><div className="pagination"><button data-testid="button-products-previous" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={15} /></button>{Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => <button key={index} className={page === index + 1 ? 'current' : ''} onClick={() => setPage(index + 1)} data-testid={`button-products-page-${index + 1}`}>{index + 1}</button>)}<button data-testid="button-products-next" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={15} /></button></div></div></>}</section>{deleteTarget && <ConfirmDialog title="Supprimer le produit ?" detail={`La suppression de « ${deleteTarget.name} » est définitive.`} loading={deleteMutation.isPending} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}</>;
}

function ProductForm({ edit = false }: { edit?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [location, setLocation] = useLocation();
  const productQuery = useGetProducts({ limit: 50 }, { query: { enabled: edit, queryKey: getGetProductsQueryKey({ limit: 50 }) } });
  const catsQuery = useGetCategories();
  const settingsQuery = useGetSettings();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const qc = useQueryClient();
  const [previews, setPreviews] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [specsList, setSpecsList] = useState<string[]>(['']);
  const form = useForm<ProductInput>({ defaultValues: { name: '', category: '', price: 0, status: 'available', stock: 0, description: '', images: [], brand: '', supplierPrice: 0, marginPercent: 20, warrantyInfo: '', deliveryInfo: '', specifications: '', isFlashSale: false } });
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;
  const selectedStatus = watch('status');
  const watchedPreview = { price: Number(watch('price') ?? 0) || 0, margin: watch('marginPercent') as unknown, category: watch('category') as string };
  const catMargin = Number(catsQuery.data?.find((c) => c.name === watchedPreview.category)?.marginPercent ?? 20);
  const effectiveMargin = watchedPreview.margin != null && watchedPreview.margin !== '' && Number(watchedPreview.margin) >= 0 ? Number(watchedPreview.margin) : catMargin;
  const roundingRule = settingsQuery.data?.roundingRule || 'none';
  const liveCalculatedPrice = Math.round(watchedPreview.price * (1 + effectiveMargin / 100));
  const roundPublished = (amount: number) => { if (roundingRule === '500') return Math.ceil(amount / 500) * 500; if (roundingRule === '1000') return Math.ceil(amount / 1000) * 1000; return Math.round(amount); };
  const liveFinalPrice = roundPublished(liveCalculatedPrice);
  const liveMarginAmount = Math.round(watchedPreview.price * effectiveMargin / 100);
  const roundingLabel = roundingRule === '500' ? 'arrondi à 500' : roundingRule === '1000' ? 'arrondi à 1000' : 'aucun arrondi';
  const showRoundingStep = roundingRule !== 'none' && liveCalculatedPrice !== liveFinalPrice;
  const formatFcf = (v: number) => v.toLocaleString('fr-FR');
  useEffect(() => { if (edit && productQuery.data) { const found = productQuery.data.items.find((product) => product.id === id); if (found) {           reset({ name: found.name, category: found.category, price: found.price, status: found.status, stock: found.stock, description: found.description, images: found.images, brand: found.brand || '', supplierPrice: found.supplierPrice ?? 0, marginPercent: found.marginPercent ?? 20, warrantyInfo: found.warrantyInfo || '', deliveryInfo: found.deliveryInfo || '', specifications: found.specifications || '', isFlashSale: Boolean(found.isFlashSale) });
          setPreviews(found.images);
          const specs = found.specifications ? found.specifications.split('\n').filter((s: string) => s.trim()) : [''];
          setSpecsList(specs.length ? specs : ['']); } } }, [edit, id, productQuery.data, reset]);
  const onSubmit = (data: ProductInput) => { const payload = { ...data, price: Number(data.price), stock: Number(data.stock ?? 0), images: previews, specifications: specsList.filter((s) => s.trim()).join('\n'), isFlashSale: data.isFlashSale === true || data.isFlashSale === 'true' }; if (edit) update.mutate({ id, data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetProductsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/products'); toast({ title: 'Produit mis à jour' }); }, onError: () => toast({ title: 'Échec de la mise à jour du produit', variant: 'destructive' }) }); else create.mutate({ data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetProductsQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/products'); toast({ title: 'Produit ajouté' }); }, onError: () => toast({ title: 'Échec de l\'ajout du produit', variant: 'destructive' }) }); };
  const handleFormSubmit = handleSubmit((data) => {
    if (step < 4) {
      setStep(4);
      return;
    }
    onSubmit(data);
  });
  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []).slice(0, 5 - previews.length); files.forEach((file) => { const reader = new FileReader(); reader.onload = () => { const value = String(reader.result); setPreviews((current) => [...current, value]); }; reader.readAsDataURL(file); }); };
  if (edit && productQuery.isLoading) return <><PageHeader title="Modifier un produit" description="Mettez à jour les informations de votre catalogue." /><div className="panel"><SkeletonRows count={5} /></div></>;
  return <>
      <PageHeader title={edit ? 'Modifier un produit' : 'Ajouter un produit'} description={edit ? 'Mettez à jour les informations de votre catalogue.' : 'Ajoutez une nouvelle référence à votre catalogue.'} />
      <div className="crumbs"><Link href="/dashboard">Dashboard</Link><ChevronRight size={14} /><Link href="/products">Produits</Link><ChevronRight size={14} /><span>{edit ? 'Modifier' : 'Ajouter un produit'}</span></div>
      <div className="wizard-steps" data-testid="product-wizard">
        <button type="button" className={`wizard-step ${step === 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`} onClick={() => setStep(1)}><span className="wizard-step-num">{step > 1 ? <Check size={14} /> : 1}</span><span>Informations</span></button>
        <button type="button" className={`wizard-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`} onClick={() => setStep(2)}><span className="wizard-step-num">{step > 2 ? <Check size={14} /> : 2}</span><span>Prix &amp; Marge</span></button>
        <button type="button" className={`wizard-step ${step === 3 ? 'active' : ''} ${step > 3 ? 'done' : ''}`} onClick={() => setStep(3)}><span className="wizard-step-num">{step > 3 ? <Check size={14} /> : 3}</span><span>Détails &amp; Images</span></button>
        <button type="button" className={`wizard-step ${step === 4 ? 'active' : ''}`} onClick={() => setStep(4)}><span className="wizard-step-num">4</span><span>Aperçu</span></button>
      </div>
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="form-layout">
          <div className="panel form-panel">
            {step === 1 && <><h2>Informations générales</h2><div className="form-grid">
              <label className="field"><span>Nom du produit <i>*</i></span><input data-testid="input-product-name" {...register('name', { required: 'Le nom est requis' })} placeholder="Ex : Montre Homme Luxe" />{errors.name && <small className="field-error">{errors.name.message}</small>}</label>
              <label className="field"><span>Prix d'achat (coût) <i>*</i></span><input data-testid="input-product-price" type="number" min="0" {...register('price', { required: true, valueAsNumber: true })} placeholder="Ex : 25000" /><small className="field-hint">La marge de la catégorie s'ajoute automatiquement pour le prix de vente.</small></label>
              <label className="field"><span>Stock <i>*</i></span><input data-testid="input-product-stock" type="number" min="0" {...register('stock', { required: true, valueAsNumber: true })} placeholder="Ex : 10" /><small className="field-hint">0 = produit en rupture</small></label>
              <label className="field"><span>Catégorie <i>*</i></span><select data-testid="select-product-form-category" {...register('category', { required: 'La catégorie est requise' })}><option value="">Sélectionnez une catégorie</option>{catsQuery.data?.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select>{errors.category && <small className="field-error">{errors.category.message}</small>}</label>
              <label className="field"><span>Disponibilité <i>*</i></span><select data-testid="select-product-form-status" {...register('status')}><option value="available">Disponible</option><option value="unavailable">Indisponible</option></select></label>
              <label className="field"><span>Marque</span><input data-testid="input-product-brand" {...register('brand')} placeholder="Ex : Apple, Nike" /></label>
            </div></>}
            {step === 2 && <><h2>Prix &amp; Marge</h2><div className="price-preview-admin"><div className="pp-item pp-cost"><span>Coût (prix d'achat)</span><strong>{formatFcf(watchedPreview.price)} FCFA</strong></div><div className="pp-plus">+</div><div className="pp-item pp-margin"><span>Marge {effectiveMargin}% {watchedPreview.margin != null && watchedPreview.margin !== '' ? <em>(saisie)</em> : <em>(catégorie)</em>}</span><strong>+{formatFcf(liveMarginAmount)} FCFA</strong></div><div className="pp-eq">=</div><div className="pp-item pp-calculated"><span>Prix calculé (avant arrondi)</span><strong>{formatFcf(liveCalculatedPrice)} FCFA</strong></div>{showRoundingStep && <><div className="pp-eq">↻</div><div className="pp-item pp-rounding"><span>Arrondi ({roundingLabel})</span><span>+{formatFcf(liveFinalPrice - liveCalculatedPrice)} FCFA</span></div></>}<div className="pp-eq">=</div><div className="pp-item pp-final"><span>Prix de vente publié</span><strong>{formatFcf(liveFinalPrice)} FCFA</strong></div></div><div className="form-grid">
              <label className="field"><span>Marge (%)</span><input data-testid="input-product-margin" type="number" min="0" {...register('marginPercent', { valueAsNumber: true })} placeholder={`Par défaut : ${catMargin}%`} /><small className="field-hint">Laissez vide pour utiliser la marge de la catégorie ({catMargin}%).</small></label>
              <label className="field"><span>Vente flash</span><select data-testid="select-product-form-flash" {...register('isFlashSale')}><option value="false">Non</option><option value="true">Oui</option></select><small className="field-hint">Met en avant ce produit en vente flash.</small></label>
            </div></>}
            {step === 3 && <><h2>Détails &amp; Images</h2><div className="form-grid">
              <label className="field"><span>Garantie</span><input data-testid="input-product-warranty" {...register('warrantyInfo')} placeholder="Ex : 12 mois de garantie" /></label>
              <label className="field"><span>Info livraison</span><input data-testid="input-product-delivery" {...register('deliveryInfo')} placeholder="Ex : Livraison à Douala sous 48h" /></label>
              <label className="field"><span>Caractéristiques</span><div className="specs-list">{specsList.map((val, idx) => <div key={idx} className="specs-row"><input data-testid={`input-product-spec-${idx}`} value={val} onChange={(e) => { const next = [...specsList]; next[idx] = e.target.value; setSpecsList(next); }} placeholder={`Caractéristique ${idx + 1}`} className="specs-input" />{specsList.length > 1 && <button type="button" className="specs-remove" onClick={() => setSpecsList(specsList.filter((_, i) => i !== idx))} title="Retirer"><X size={14} /></button>}</div>)}<button type="button" className="specs-add" onClick={() => setSpecsList([...specsList, ''])}><Plus size={14} /> Ajouter une caractéristique</button></div><small className="field-hint">Une caractéristique par ligne. Ex : Matériau, Couleur, Dimensions...</small></label>
              <label className="field"><span>Description <i>*</i></span><textarea data-testid="input-product-description" {...register('description', { required: 'La description est requise' })} placeholder="Décrivez votre produit en détail : caractéristiques, avantages, matériaux, etc." rows={6} />{errors.description && <small className="field-error">{errors.description.message}</small>}</label>
              <div className="field"><span>Images du produit <i>*</i></span><label className="upload-zone" htmlFor="product-images"><UploadCloud size={25} /><strong>Cliquez pour télécharger des images</strong><small>ou glissez-déposez ici</small><em>Formats acceptés : JPG, PNG, WEBP (Max. 5 Mo par image)</em><input id="product-images" data-testid="input-product-images" type="file" accept="image/*" multiple onChange={onFiles} /></label></div>
              <div className="upload-note">Vous pouvez ajouter jusqu'à 5 images</div>{previews.length > 0 && <div className="preview-grid">{previews.map((image, index) => <div className="preview-item" key={`${image.slice(0, 15)}-${index}`}><img src={image} alt={`Aperçu ${index + 1}`} /><button type="button" onClick={() => setPreviews((current) => current.filter((_, item) => item !== index))} data-testid={`button-remove-image-${index}`}><X size={13} /></button></div>)}</div>}
            </div></>}
            {step === 4 && <><h2>Aperçu de la fiche produit</h2><div className="product-review" data-testid="product-review">
              <div className="product-review-media">{previews[0] ? <img src={previews[0]} alt="Avis produit" /> : <div className="product-review-placeholder"><Box size={40} /></div>}</div>
              <div className="product-review-body">
                <span className="product-review-category">{watchedPreview.category || 'Catégorie'}</span>
                <h3>{String(watch('name') || 'Nom du produit')}</h3>
                <div className="product-review-price"><strong>{formatFcf(liveFinalPrice)} FCFA</strong><span className="product-review-margin">prix publié · marge {effectiveMargin}% · coût {formatFcf(watchedPreview.price)} FCFA{showRoundingStep ? ` · ${roundingLabel}` : ''}</span></div>
                <p className="product-review-desc">{String(watch('description') || 'Aucune description fournie.')}</p>
                <div className="product-review-stock"><StatusBadge status={selectedStatus} /><span className="muted-cell">{Number(watch('stock') ?? 0)} en stock</span></div>
              </div>
            </div></>}
          </div>
          <aside className="panel summary-panel"><h2>Résumé</h2><span className="summary-label">Statut du produit</span><StatusBadge status={selectedStatus} /><div className="summary-illustration"><Box size={52} /><Plus size={15} className="spark one" /><Plus size={13} className="spark two" /></div><p>Une fois le produit enregistré, il sera visible sur votre boutique en ligne.</p></aside>
          <div className="form-actions">
            <button type="button" data-testid="button-cancel-product" className="button button-outline" onClick={() => setLocation('/products')}>Annuler</button>
            {step > 1 && <button type="button" data-testid="button-wizard-prev" className="button button-outline" onClick={() => setStep((s) => s - 1)}><ChevronLeft size={16} /> Précédent</button>}
            {step < 4 ? <button type="button" data-testid="button-wizard-next" className="button button-primary" onClick={() => setStep((s) => s + 1)}>{step === 3 ? 'Voir l\'aperçu ' : ''}Suivant <ChevronRight size={16} /></button> : <button type="submit" data-testid="button-submit-product" className="button button-primary" disabled={create.isPending || update.isPending}>{(create.isPending || update.isPending) ? <Loader2 className="spin" size={16} /> : <Check size={16} />}{edit ? 'Enregistrer les modifications' : 'Publier le produit'}</button>}
          </div>
        </form>
      </Form>
    </>;
}

function CategoryTable({ categories, onDelete }: { categories: Category[]; onDelete: (category: Category) => void }) {
  return <div className="table-scroll"><table className="data-table category-table"><thead><tr><th>Catégorie</th><th>Nombre de produits</th><th>Statut</th><th>Date d'ajout</th><th className="align-right">Actions</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} data-testid={`row-category-${category.id}`}><td><div className="category-cell"><span className="category-icon"><Tag size={18} /></span><strong>{category.name}</strong></div></td><td>{category.productCount}</td><td><StatusBadge status={category.status} /></td><td className="muted-cell">{date(category.dateAdded)}</td><td><div className="row-actions"><Link href={`/categories/${category.id}/edit`} className="action-button edit" data-testid={`button-edit-category-${category.id}`}><Pencil size={15} /></Link><button className="action-button delete" onClick={() => onDelete(category)} data-testid={`button-delete-category-${category.id}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>;
}

function Categories() {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const query = useGetCategories(search ? { search } : undefined);
  const remove = useDeleteCategory();
  const qc = useQueryClient();
  const confirm = () => { if (!deleteTarget) return; remove.mutate({ id: deleteTarget.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetCategoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setDeleteTarget(null); toast({ title: 'Catégorie supprimée' }); }, onError: () => toast({ title: 'Échec de la suppression de la catégorie', variant: 'destructive' }) }); };
  return <><PageHeader title="Catégories" description="Gérez toutes les catégories de produits." action={<Link href="/categories/new" data-testid="button-add-category" className="button button-primary"><Plus size={16} /> Ajouter une catégorie</Link>} /><section className="panel table-panel"><div className="filter-bar"><label className="search-field category-search"><Search size={17} /><input data-testid="input-category-search" placeholder="Rechercher une catégorie..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><button data-testid="button-reset-categories" onClick={() => setSearch('')} className="button button-outline reset-button"><RefreshCcw size={14} /> Réinitialiser</button></div>{query.isLoading ? <SkeletonRows count={7} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : (query.data?.length ?? 0) === 0 ? <EmptyState icon={Grid2X2} title="Aucune catégorie trouvée" detail="Créez une catégorie pour organiser votre catalogue." action={<Link href="/categories/new" className="button button-primary">Ajouter une catégorie</Link>} /> : <><CategoryTable categories={query.data!} onDelete={setDeleteTarget} /><div className="table-footer"><span>Affichage de {query.data!.length} catégories</span><div className="pagination"><button disabled><ChevronLeft size={15} /></button><button className="current">1</button><button disabled><ChevronRight size={15} /></button></div></div></>}</section>{deleteTarget && <ConfirmDialog title="Supprimer la catégorie ?" detail={`La suppression de « ${deleteTarget.name} » est définitive.`} loading={remove.isPending} onCancel={() => setDeleteTarget(null)} onConfirm={confirm} />}</>;
}

function CategoryForm({ edit = false }: { edit?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const query = useGetCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const qc = useQueryClient();
  const form = useForm<CategoryInput>({ defaultValues: { name: '', status: 'active', icon: '', slug: '', description: '', imageUrl: null, marginPercent: 20 } });
  const { register, handleSubmit, reset, formState: { errors } } = form;
  const [heroPreviews, setHeroPreviews] = useState<string[]>([]);
  useEffect(() => { const found = query.data?.find((category) => category.id === id); if (edit && found) { reset({ name: found.name, status: found.status, icon: found.icon, slug: found.slug ?? '', description: found.description ?? '', imageUrl: found.imageUrl ?? null, marginPercent: found.marginPercent ?? 20 }); const imgs = found.images?.length ? found.images : (found.imageUrl ? [found.imageUrl] : []); setHeroPreviews(imgs); } }, [edit, id, query.data, reset]);
  const onPickHero = (event: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []); files.forEach((file) => { const reader = new FileReader(); reader.onload = () => { const value = String(reader.result); setHeroPreviews((cur) => [...cur, value]); }; reader.readAsDataURL(file); }); event.target.value = ''; };
  const onSubmit = (data: CategoryInput) => { const payload = { ...data, images: heroPreviews }; if (edit) update.mutate({ id, data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetCategoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/categories'); toast({ title: 'Catégorie mise à jour' }); }, onError: () => toast({ title: 'Échec de la mise à jour de la catégorie', variant: 'destructive' }) }); else create.mutate({ data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetCategoriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/categories'); toast({ title: 'Catégorie ajoutée' }); }, onError: () => toast({ title: 'Échec de l\'ajout de la catégorie', variant: 'destructive' }) }); };
  if (edit && query.isLoading) return <><PageHeader title="Modifier une catégorie" description="Mettez à jour les informations de votre catalogue." /><div className="panel"><SkeletonRows count={3} /></div></>;
  if (edit && query.isError) return <><PageHeader title="Modifier une catégorie" description="Mettez à jour les informations de votre catalogue." /><QueryError retry={() => query.refetch()} /></>;
  return <><PageHeader title={edit ? 'Modifier une catégorie' : 'Ajouter une catégorie'} description="Organisez votre catalogue pour aider vos clients à trouver les bons produits." /><div className="crumbs"><Link href="/dashboard">Dashboard</Link><ChevronRight size={14} /><Link href="/categories">Catégories</Link><ChevronRight size={14} /><span>{edit ? 'Modifier' : 'Ajouter une catégorie'}</span></div><Form {...form}><form onSubmit={handleSubmit(onSubmit)} className="narrow-form panel form-panel"><h2>Informations de la catégorie</h2><label className="field"><span>Nom de la catégorie <i>*</i></span><input data-testid="input-category-name" {...register('name', { required: 'Le nom est requis' })} placeholder="Ex : Mode" />{errors.name && <small className="field-error">{errors.name.message}</small>}</label><label className="field"><span>Icône</span><input data-testid="input-category-icon" {...register('icon')} placeholder="Ex : Mode, Chaussures, Tech" /></label><label className="field"><span>Statut</span><select data-testid="select-category-status" {...register('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label className="field"><span>URL (slug)</span><input data-testid="input-category-slug" {...register('slug')} placeholder="Ex : mode" /><small className="field-hint">Identifiant unique utilisé dans les liens. Laissez vide pour un slug automatique.</small></label><label className="field"><span>Marge par défaut (%)</span><input data-testid="input-category-margin" type="number" min="0" {...register('marginPercent', { valueAsNumber: true })} placeholder="Ex : 20" /><small className="field-hint">Appliquée automatiquement au prix des produits de cette catégorie.</small></label><label className="field"><span>Images bannière (page de la catégorie)</span><div className="category-images">{heroPreviews.map((imgs, idx) => <div className="category-image" key={idx} data-testid={`category-image-${idx}`}><img src={imgs} alt={`Bannière ${idx + 1}`} /><button type="button" className="action-button delete" onClick={() => setHeroPreviews((cur) => cur.filter((_, i) => i !== idx))}><Trash2 size={15} /></button></div>)}{heroPreviews.length > 0 ? <div className="category-image category-image-add" onClick={() => document.getElementById('category-hero')?.click()}>+</div> : null}</div><div className="upload-row-line"><label className="button button-outline" htmlFor="category-hero"><UploadCloud size={15} /> Importer des images (<input id="category-hero" data-testid="input-category-image" type="file" accept="image/*" multiple hidden onChange={onPickHero} />) {heroPreviews.length > 0 ? 'Ajouter' : 'Choisir'}</label><small className="field-hint">Plusieurs images autorisées. Elles s'afficheront en rotation sur la page de la catégorie.</small></div></label><label className="field"><span>Description</span><textarea data-testid="input-category-description" {...register('description')} rows={3} placeholder="Description de la catégorie" /></label><label className="field"><span>Marge par défaut (%)</span><input data-testid="input-category-margin" type="number" min="0" {...register('marginPercent', { valueAsNumber: true })} placeholder="Ex : 20" /><small className="field-hint">Marge appliquée aux produits de cette catégorie.</small></label><div className="form-actions"><button type="button" data-testid="button-cancel-category" className="button button-outline" onClick={() => setLocation('/categories')}>Annuler</button><button type="submit" data-testid="button-submit-category" className="button button-primary" disabled={create.isPending || update.isPending}>{(create.isPending || update.isPending) ? <Loader2 className="spin" size={16} /> : <Check size={16} />}{edit ? 'Enregistrer les modifications' : 'Enregistrer la catégorie'}</button></div></form></Form></>;
}

function ReviewStars({ value }: { value: number }) {
  return <span className="review-stars" aria-label={`${value} sur 5`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={14} fill={star <= value ? 'currentColor' : 'none'} />)}</span>;
}

type SupplierRow = { id: number; name: string; email?: string; phone?: string; address?: string; note?: string; status: string; dateAdded: string; };
type PromotionRow = { id: number; name: string; productId: number | null; discountPercent?: number; startDate?: string | null; endDate?: string | null; active: number | boolean; dateAdded: string; };

type AnnouncementRow = { id: number; title: string; body?: string; imageUrl?: string | null; linkUrl?: string | null; bgColor?: string; textColor?: string; active: number | boolean; sortOrder?: number; dateAdded: string; };

function Suppliers() {
  const [deleteTarget, setDeleteTarget] = useState<SupplierRow | null>(null);
  const query = useGetSuppliers();
  const remove = useDeleteSupplier();
  const qc = useQueryClient();
  const supData = (query.data ?? []) as SupplierRow[];
  const confirm = () => {
    if (!deleteTarget) return;
    remove.mutate({ id: deleteTarget.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteTarget(null); toast({ title: 'Fournisseur supprimé' }); }, onError: () => toast({ title: 'Échec de la suppression du fournisseur', variant: 'destructive' }) });
  };
  return <><PageHeader title="Fournisseurs" description="Gérez vos fournisseurs et les marges de vos produits." action={<Link href="/suppliers/new" data-testid="button-add-supplier" className="button button-primary"><Plus size={16} /> Ajouter un fournisseur</Link>} /><section className="panel table-panel">{query.isLoading ? <SkeletonRows count={5} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : supData.length === 0 ? <EmptyState icon={Truck} title="Aucun fournisseur" detail="Ajoutez un fournisseur pour gérer vos achats." action={<Link href="/suppliers/new" className="button button-primary">Ajouter un fournisseur</Link>} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Nom</th><th>Téléphone</th><th>Email</th><th>Adresse</th><th>Statut</th><th className="align-right">Actions</th></tr></thead><tbody>{supData.map((s) => <tr key={s.id} data-testid={`row-supplier-${s.id}`}><td><div className="product-cell"><div className="product-thumb thumb-fallback">{s.name.slice(0, 2).toUpperCase()}</div><strong>{s.name}</strong></div></td><td className="muted-cell">{s.phone || '-'}</td><td className="muted-cell">{s.email || '-'}</td><td className="muted-cell">{s.address || '-'}</td><td><StatusBadge status={s.status || 'active'} /></td><td><div className="row-actions"><Link href={`/suppliers/${s.id}/edit`} className="action-button edit" data-testid={`button-edit-supplier-${s.id}`}><Pencil size={15} /></Link><button className="action-button delete" onClick={() => setDeleteTarget(s)} data-testid={`button-delete-supplier-${s.id}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}</section>{deleteTarget && <ConfirmDialog title="Supprimer le fournisseur ?" detail={`La suppression de « ${deleteTarget.name} » est définitive.`} loading={remove.isPending} onCancel={() => setDeleteTarget(null)} onConfirm={confirm} />}</>;
}

function SupplierForm({ edit = false }: { edit?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const query = useGetSuppliers();
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const qc = useQueryClient();
  const form = useForm({ defaultValues: { name: '', phone: '', email: '', address: '', note: '', status: 'active' } });
  const { register, handleSubmit, reset, formState: { errors } } = form;
  useEffect(() => { const found = (query.data ?? []).find((s: any) => s.id === id); if (edit && found) reset(found); }, [edit, id, query.data, reset]);
  const onSubmit = (data: any) => {
    if (edit) update.mutate({ id, data }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setLocation('/suppliers'); toast({ title: 'Fournisseur mis à jour' }); }, onError: () => toast({ title: 'Échec de la mise à jour du fournisseur', variant: 'destructive' }) });
    else create.mutate({ data }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setLocation('/suppliers'); toast({ title: 'Fournisseur ajouté' }); }, onError: () => toast({ title: 'Échec de l\'ajout du fournisseur', variant: 'destructive' }) });
  };
  return <><PageHeader title={edit ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'} description="Enregistrez les coordonnées et le statut d'un fournisseur." /><div className="crumbs"><Link href="/dashboard">Dashboard</Link><ChevronRight size={14} /><Link href="/suppliers">Fournisseurs</Link><ChevronRight size={14} /><span>{edit ? 'Modifier' : 'Ajouter'}</span></div><Form {...form}><form onSubmit={handleSubmit(onSubmit)} className="narrow-form panel form-panel"><h2>Informations du fournisseur</h2><label className="field"><span>Nom <i>*</i></span><input data-testid="input-supplier-name" {...register('name', { required: 'Le nom est requis' })} placeholder="Ex : Distributeur Douala" />{errors.name && <small className="field-error">{errors.name.message}</small>}</label><label className="field"><span>Téléphone</span><input data-testid="input-supplier-phone" {...register('phone')} placeholder="Ex : 6 90 00 00 00" /></label><label className="field"><span>Email</span><input data-testid="input-supplier-email" {...register('email')} type="email" placeholder="fournisseur@exemple.com" /></label><label className="field"><span>Adresse</span><input data-testid="input-supplier-address" {...register('address')} placeholder="Ex : Douala, Cameroun" /></label><label className="field"><span>Note</span><textarea data-testid="input-supplier-note" {...register('note')} rows={3} placeholder="Remarques éventuelles" /></label><label className="field"><span>Statut</span><select data-testid="select-supplier-status" {...register('status')}><option value="active">Actif</option><option value="inactive">Inactif</option></select></label><div className="form-actions"><button type="button" data-testid="button-cancel-supplier" className="button button-outline" onClick={() => setLocation('/suppliers')}>Annuler</button><button type="submit" data-testid="button-submit-supplier" className="button button-primary" disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? <Loader2 className="spin" size={16} /> : <Check size={16} />}{edit ? 'Enregistrer les modifications' : 'Enregistrer le fournisseur'}</button></div></form></Form></>;
}

function Promotions() {
  const [deleteTarget, setDeleteTarget] = useState<PromotionRow | null>(null);
  const query = useGetPromotions();
  const remove = useDeletePromotion();
  const qc = useQueryClient();
  const promData = (query.data ?? []) as PromotionRow[];
  const confirm = () => {
    if (!deleteTarget) return;
    remove.mutate({ id: deleteTarget.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); setDeleteTarget(null); toast({ title: 'Promotion supprimée' }); }, onError: () => toast({ title: 'Échec de la suppression de la promotion', variant: 'destructive' }) });
  };
  return <><PageHeader title="Promotions" description="Créez des promotions et des ventes flash sur vos produits." action={<Link href="/promotions/new" data-testid="button-add-promotion" className="button button-primary"><Plus size={16} /> Ajouter une promotion</Link>} /><section className="panel table-panel">{query.isLoading ? <SkeletonRows count={5} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : promData.length === 0 ? <EmptyState icon={Percent} title="Aucune promotion" detail="Créez une promotion pour booster vos ventes." action={<Link href="/promotions/new" className="button button-primary">Ajouter une promotion</Link>} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Nom</th><th>Produit</th><th>Remise</th><th>Période</th><th>Statut</th><th className="align-right">Actions</th></tr></thead><tbody>{promData.map((p) => <tr key={p.id} data-testid={`row-promotion-${p.id}`}><td><div className="product-cell"><div className="product-thumb thumb-fallback"><Percent size={16} /></div><strong>{p.name}</strong></div></td><td className="muted-cell">{p.productId ? `#${p.productId}` : 'Tous les produits'}</td><td><span className="status-badge status-warm">{p.discountPercent ?? 0}%</span></td><td className="muted-cell">{p.startDate ? `${new Date(p.startDate).toLocaleDateString('fr-FR')} → ${p.endDate ? new Date(p.endDate).toLocaleDateString('fr-FR') : '…'}` : 'Permanent'}</td><td><StatusBadge status={p.active ? 'active' : 'inactive'} /></td><td><div className="row-actions"><Link href={`/promotions/${p.id}/edit`} className="action-button edit" data-testid={`button-edit-promotion-${p.id}`}><Pencil size={15} /></Link><button className="action-button delete" onClick={() => setDeleteTarget(p)} data-testid={`button-delete-promotion-${p.id}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}</section>{deleteTarget && <ConfirmDialog title="Supprimer la promotion ?" detail={`La suppression de « ${deleteTarget.name} » est définitive.`} loading={remove.isPending} onCancel={() => setDeleteTarget(null)} onConfirm={confirm} />}</>;
}

function PromotionForm({ edit = false }: { edit?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const query = useGetPromotions();
  const productsQuery = useGetProducts({ limit: 100 });
  const categoriesQuery = useGetCategories();
  const create = useCreatePromotion();
  const update = useUpdatePromotion();
  const qc = useQueryClient();
  const form = useForm({ defaultValues: { name: '', productId: '', categoryName: '', discountPercent: 0, startDate: '', endDate: '', active: false } });
  const { register, handleSubmit, reset, watch, formState: { errors } } = form;
  const selProduct = watch('productId');
  const selCategory = watch('categoryName');
  useEffect(() => { const found = (query.data ?? []).find((p: any) => p.id === id); if (edit && found) reset({ name: found.name, productId: String(found.productId ?? ''), categoryName: String(found.categoryName ?? ''), discountPercent: found.discountPercent ?? 0, startDate: found.startDate ?? '', endDate: found.endDate ?? '', active: Boolean(found.active) }); }, [edit, id, query.data, reset]);
  const onSubmit = (data: any) => {
    if (!data.productId && !data.categoryName) { toast({ title: 'Choisissez un produit ou une catégorie', variant: 'destructive' }); return; }
    const payload = { name: data.name, productId: data.productId ? Number(data.productId) : null, categoryName: data.categoryName || null, discountPercent: Number(data.discountPercent) || 0, startDate: data.startDate || null, endDate: data.endDate || null, active: data.active };
    if (edit) update.mutate({ id, data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); setLocation('/promotions'); toast({ title: 'Promotion mise à jour' }); }, onError: () => toast({ title: 'Échec de la mise à jour de la promotion', variant: 'destructive' }) });
    else create.mutate({ data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['promotions'] }); setLocation('/promotions'); toast({ title: 'Promotion ajoutée' }); }, onError: () => toast({ title: 'Échec de l\'ajout de la promotion', variant: 'destructive' }) });
  };
  return <><PageHeader title={edit ? 'Modifier la promotion' : 'Ajouter une promotion'} description="Définissez la remise et la période de validité." /><div className="crumbs"><Link href="/dashboard">Dashboard</Link><ChevronRight size={14} /><Link href="/promotions">Promotions</Link><ChevronRight size={14} /><span>{edit ? 'Modifier' : 'Ajouter'}</span></div><Form {...form}><form onSubmit={handleSubmit(onSubmit)} className="narrow-form panel form-panel"><h2>Détails de la promotion</h2><label className="field"><span>Nom <i>*</i></span><input data-testid="input-promotion-name" {...register('name', { required: 'Le nom est requis' })} placeholder="Ex : Soldes fin de mois" />{errors.name && <small className="field-error">{errors.name.message}</small>}</label><label className="field"><span>Produit ciblé</span><select data-testid="select-promotion-product" {...register('productId')}><option value="">— Aucun produit —</option>{productsQuery.data?.items.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><small className="field-hint">Remise sur un produit précis.</small></label><label className="field"><span>Catégorie ciblée</span><select data-testid="select-promotion-category" {...register('categoryName')}><option value="">— Aucune catégorie —</option>{categoriesQuery.data?.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}</select><small className="field-hint">Remise sur tous les produits de la catégorie.</small></label><label className="field"><span>Remise (%) <i>*</i></span><input data-testid="input-promotion-discount" type="number" min="0" max="100" {...register('discountPercent', { required: true, valueAsNumber: true })} placeholder="Ex : 20" /></label><label className="field"><span>Date de début</span><input data-testid="input-promotion-start" type="date" {...register('startDate')} /></label><label className="field"><span>Date de fin</span><input data-testid="input-promotion-end" type="date" {...register('endDate')} /></label><label className="field"><span>Statut</span><select data-testid="select-promotion-status" {...register('active')}><option value="true">Active</option><option value="false">Inactive</option></select></label><div className="form-actions"><button type="button" data-testid="button-cancel-promotion" className="button button-outline" onClick={() => setLocation('/promotions')}>Annuler</button><button type="submit" data-testid="button-submit-promotion" className="button button-primary" disabled={create.isPending || update.isPending || (!selProduct && !selCategory)}>{create.isPending || update.isPending ? <Loader2 className="spin" size={16} /> : <Check size={16} />}{edit ? 'Enregistrer les modifications' : 'Enregistrer la promotion'}</button></div></form></Form></>;
}

function AnnouncementsBanner({ banner }: { banner: AnnouncementRow }) {
  return <div className="announcement-card" style={{ backgroundColor: banner.bgColor || '#ed671c', color: banner.textColor || '#ffffff' }}>{banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title} loading="lazy" /> : null}<div><strong>{banner.title}</strong>{banner.body ? <p>{banner.body}</p> : null}</div><span className="status-badge">{banner.active ? 'active' : 'inactive'}</span></div>;
}

function Announcements() {
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(null);
  const query = useListAnnouncements();
  const remove = useDeleteAnnouncement();
  const qc = useQueryClient();
  const annData = (query.data ?? []) as AnnouncementRow[];
  const confirm = () => {
    if (!deleteTarget) return;
    remove.mutate({ id: deleteTarget.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setDeleteTarget(null); toast({ title: 'Bandeau supprimé' }); }, onError: () => toast({ title: 'Échec de la suppression du bandeau', variant: 'destructive' }) });
  };
  return <><PageHeader title="Bandeaux d'annonces" description="Créez des bandeaux décoratifs avec image affichés sur le site public." action={<Link href="/announcements/new" data-testid="button-add-announcement" className="button button-primary"><Plus size={16} /> Ajouter un bandeau</Link>} /><section className="panel table-panel">{query.isLoading ? <SkeletonRows count={4} /> : query.isError ? <QueryError retry={() => query.refetch()} /> : annData.length === 0 ? <EmptyState icon={Megaphone} title="Aucun bandeau" detail="Créez un bandeau avec une image pour animer le site public." action={<Link href="/announcements/new" className="button button-primary">Ajouter un bandeau</Link>} /> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Bandeau</th><th>Couleur</th><th>Ordre</th><th>Statut</th><th className="align-right">Actions</th></tr></thead><tbody>{annData.map((a) => <tr key={a.id} data-testid={`row-announcement-${a.id}`}><td><div className="product-cell"><div className="product-thumb thumb-fallback"><Megaphone size={16} /></div><strong>{a.title}</strong></div></td><td><span className="color-swatch" style={{ backgroundColor: a.bgColor || '#ed671c' }} title={a.bgColor || '#ed671c'} /></td><td className="muted-cell">{a.sortOrder ?? 0}</td><td><a href={a.linkUrl || '#'} target="_blank" rel="noreferrer">{a.active ? 'Active' : 'Inactive'}</a></td><td><div className="row-actions"><Link href={`/announcements/${a.id}/edit`} className="action-button edit" data-testid={`button-edit-announcement-${a.id}`}><Pencil size={15} /></Link><button className="action-button delete" onClick={() => setDeleteTarget(a)} data-testid={`button-delete-announcement-${a.id}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}</section>{deleteTarget && <ConfirmDialog title="Supprimer le bandeau ?" detail={`La suppression de « ${deleteTarget.title} » est définitive.`} loading={remove.isPending} onCancel={() => setDeleteTarget(null)} onConfirm={confirm} />}</>;
}

function AnnouncementForm({ edit = false }: { edit?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const query = useListAnnouncements();
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<string | null>(null);
  const form = useForm({ defaultValues: { title: '', body: '', imageUrl: '', linkUrl: '', bgColor: '#ed671c', textColor: '#ffffff', active: true, sortOrder: 0 } });
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;
  const activeValue = watch('active');
  useEffect(() => { const found = (query.data ?? []).find((a: any) => a.id === id); if (edit && found) { reset({ title: found.title ?? '', body: found.body ?? '', imageUrl: '', linkUrl: found.linkUrl ?? '', bgColor: found.bgColor ?? '#ed671c', textColor: found.textColor ?? '#ffffff', active: Boolean(found.active), sortOrder: found.sortOrder ?? 0 }); if (found.imageUrl) { setValue('imageUrl', found.imageUrl); setPreview(found.imageUrl); } } }, [edit, id, query.data, reset, setValue]);
  const onPickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const value = String(reader.result); setValue('imageUrl', value, { shouldValidate: true }); setPreview(value); };
    reader.readAsDataURL(file);
  };
  const onSubmit = (data: any) => {
    const payload: AnnouncementInput = { title: data.title, body: data.body || '', imageUrl: data.imageUrl || null, linkUrl: data.linkUrl || null, bgColor: data.bgColor || '#ed671c', textColor: data.textColor || '#ffffff', active: data.active, sortOrder: Number(data.sortOrder) || 0 };
    if (edit) update.mutate({ id, data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setLocation('/announcements'); toast({ title: 'Bandeau mis à jour' }); }, onError: () => toast({ title: 'Échec de la mise à jour du bandeau', variant: 'destructive' }) });
    else create.mutate({ data: payload }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setLocation('/announcements'); toast({ title: 'Bandeau ajouté' }); }, onError: () => toast({ title: 'Échec de l\'ajout du bandeau', variant: 'destructive' }) });
  };
  return <><PageHeader title={edit ? 'Modifier le bandeau' : 'Ajouter un bandeau'} description="Bandeau décoratif avec image affiché sur le site public." /><div className="crumbs"><Link href="/dashboard">Dashboard</Link><ChevronRight size={14} /><Link href="/announcements">Bandeaux</Link><ChevronRight size={14} /><span>{edit ? 'Modifier' : 'Ajouter'}</span></div><Form {...form}><form onSubmit={handleSubmit(onSubmit)} className="narrow-form panel form-panel"><h2>Contenu du bandeau</h2><label className="field"><span>Titre <i>*</i></span><input data-testid="input-announcement-title" {...register('title', { required: 'Le titre est requis' })} placeholder="Ex : Soldes exceptionnelles" />{errors.title && <small className="field-error">{errors.title.message}</small>}</label><label className="field"><span>Texte (optionnel)</span><textarea data-testid="input-announcement-body" rows={2} {...register('body')} placeholder="Ex : -30% sur toute la maison ce week-end" /></label><label className="field"><span>Image (bandeau décoratif)</span><div className="logo-upload"><div className="settings-logo">{preview ? <img src={preview} alt="Aperçu du bandeau" /> : <Megaphone size={26} />}</div><label className="button button-outline" htmlFor="announcement-image"><UploadCloud size={15} /> {preview ? "Changer l'image" : 'Choisir une image'}<input id="announcement-image" data-testid="input-announcement-image" type="file" accept="image/*" hidden onChange={onPickImage} /></label>{preview ? <button type="button" className="button button-outline" onClick={() => { setValue('imageUrl', ''); setPreview(null); }}>Retirer</button> : null}</div></label><label className="field"><span>Couleur de fond</span><div className="accent-field"><span className="accent-swatch" style={{ background: watch('bgColor') || '#ed671c' }} aria-hidden="true" /><input data-testid="input-announcement-bg" {...register('bgColor')} placeholder="#ed671c" /><input type="color" {...register('bgColor')} aria-label="Choisir la couleur de fond" /></div></label><label className="field"><span>Couleur du texte</span><div className="accent-field"><span className="accent-swatch" style={{ background: watch('textColor') || '#ffffff' }} aria-hidden="true" /><input data-testid="input-announcement-text" {...register('textColor')} placeholder="#ffffff" /><input type="color" {...register('textColor')} aria-label="Choisir la couleur du texte" /></div></label><label className="field"><span>Ordre d'affichage</span><input type="number" data-testid="input-announcement-sort" {...register('sortOrder', { valueAsNumber: true })} placeholder="0" /></label><label className="field"><span>Statut</span><select data-testid="select-announcement-status" {...register('active')}><option value="true">Active (visible)</option><option value="false">Inactive</option></select></label>{activeValue === 'true' ? <div className="settings-note announcement-preview" style={{ backgroundColor: watch('bgColor') || '#ed671c', color: watch('textColor') || '#ffffff' }}>{watch('imageUrl') ? <img src={watch('imageUrl')} className="announcement-preview-img" alt="" /> : null}<div><strong>{(watch('title') || 'Titre du bandeau')}</strong>{watch('body') ? <p>{(watch('body'))}</p> : null}</div></div> : null}<div className="form-actions"><button type="button" data-testid="button-cancel-announcement" className="button button-outline" onClick={() => setLocation('/announcements')}>Annuler</button><button type="submit" className="button button-primary">{edit ? 'Enregistrer' : 'Créer le bandeau'}</button></div></form></Form></>;
}

function Reviews() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const pendingQuery = useGetAllReviews('pending');
  const approvedQuery = useGetAllReviews('approved');
  const rejectedQuery = useGetAllReviews('rejected');
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const qc = useQueryClient();
  const active = tab === 'pending' ? pendingQuery : tab === 'approved' ? approvedQuery : rejectedQuery;
  const counts = { pending: pendingQuery.data?.length ?? 0, approved: approvedQuery.data?.length ?? 0, rejected: rejectedQuery.data?.length ?? 0 };
  const changeStatus = (review: Review, status: Review['status']) => {
    updateReview.mutate({ id: review.id, status }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetAllReviewsQueryKey() }); qc.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() }); toast({ title: 'Avis mis à jour' }); }, onError: () => toast({ title: 'Échec de la mise à jour de l\'avis', variant: 'destructive' }),
    });
  };
  const toggleVerified = (review: Review) => {
    updateReview.mutate({ id: review.id, status: review.status, verified: !review.verified }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetAllReviewsQueryKey() }); toast({ title: 'Achat vérifié mis à jour' }); }, onError: () => toast({ title: 'Échec de la mise à jour de l\'avis', variant: 'destructive' }),
    });
  };
  const removeReview = (review: Review) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) return;
    deleteReview.mutate({ id: review.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetAllReviewsQueryKey() }); toast({ title: 'Avis supprimé' }); }, onError: () => toast({ title: 'Échec de la suppression de l\'avis', variant: 'destructive' }) });
  };
  const tabs = [
    { key: 'pending' as const, label: 'En attente' },
    { key: 'approved' as const, label: 'Approuvés' },
    { key: 'rejected' as const, label: 'Rejetés' },
  ];
  return <><PageHeader title="Avis clients" description="Modérez les avis laissés sur vos produits avant publication." /><div className="review-tabs">{tabs.map(({ key, label }) => <button key={key} className={`review-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)} data-testid={`review-tab-${key}`}>{label}<span className="review-tab-count">{counts[key]}</span></button>)}</div><section className="panel reviews-panel-admin">{active.isLoading ? <SkeletonRows count={4} /> : active.isError ? <QueryError retry={() => active.refetch()} /> : (active.data?.length ?? 0) === 0 ? <EmptyState icon={MessageSquare} title="Aucun avis dans cet onglet" detail="Les avis envoyés par vos clients apparaîtront ici." /> : <div className="reviews-grid">{active.data!.map((review) => <article className="review-admin-card" key={review.id} data-testid={`review-admin-${review.id}`}><div className="review-admin-head"><div><strong>{review.author}</strong><span className="muted-cell">{date(review.dateAdded)}</span></div><StatusBadge status={review.status} /></div><div className="review-admin-meta"><ReviewStars value={review.rating} /><span>· {review.rating}/5</span></div><p className="review-admin-comment">« {review.comment} »</p>{review.image && <img src={review.image} alt={`Photo de l'avis de ${review.author}`} className="review-admin-img" loading="lazy" data-testid={`review-image-${review.id}`} />}<div className="review-admin-product"><Box size={14} /> {review.productName ?? `Produit #${review.productId}`}</div><div className="review-admin-actions">{review.status !== 'approved' && <button className="button button-primary button-small" onClick={() => changeStatus(review, 'approved')} disabled={updateReview.isPending} data-testid={`review-approve-${review.id}`}><ThumbsUp size={14} /> Approuver</button>}{review.status !== 'rejected' && <button className="button button-outline button-small" onClick={() => changeStatus(review, 'rejected')} disabled={updateReview.isPending} data-testid={`review-reject-${review.id}`}><Ban size={14} /> Rejeter</button>}<button className={`button button-small ${review.verified ? 'button-primary' : 'button-outline'}`} onClick={() => toggleVerified(review)} disabled={updateReview.isPending} data-testid={`review-verified-${review.id}`}><Check size={14} /> {review.verified ? 'Achat vérifié' : 'Marquer vérifié'}</button><button className="button button-danger button-small" onClick={() => removeReview(review)} disabled={deleteReview.isPending} data-testid={`review-delete-${review.id}`}><Trash2 size={14} /> Supprimer</button></div></article>)}</div>}</section></>;
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    api.login(password)
      .then(({ token }) => { authToken.set(token); onLogin(); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Connexion impossible'))
      .finally(() => setLoading(false));
  };
  return <div className="login-screen"><div className="login-card panel"><img className="login-logo" src={logo} alt="ACHAT+" /><h1>Espace administrateur</h1><p>Connectez-vous pour gérer votre boutique.</p><form onSubmit={submit}><label className="field"><span>Mot de passe</span><input data-testid="input-login-password" type="password" autoFocus value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="login-error" role="alert">{error}</p>}<button type="submit" data-testid="button-login" className="button button-primary login-button" disabled={loading || !password}>{loading ? <Loader2 className="spin" size={16} /> : null}{loading ? 'Connexion…' : 'Se connecter'}</button></form><small className="login-hint">Mot de passe par défaut : <strong>achat123</strong> <span>(modifiable dans Paramètres)</span></small></div></div>;
}

function SettingsPage() {
  const query = useGetSettings();
  const update = useUpdateSettings();
  const qc = useQueryClient();
  const [logoPreview, setLogoPreview] = useState('');
  const [heroPreview, setHeroPreview] = useState('');
  const form = useForm<SettingsInput>({ defaultValues: { storeName: '', logo: '', whatsapp: '', description: '', adminName: '', adminEmail: '', adminPassword: '', accentColor: '#ed671c', heroEnabled: false, heroImage: '', heroTitle: '', heroSubtitle: '', heroCtaText: '', announcement: '', roundingRule: 'none', sellingMinProducts: 10, popularMinProducts: 10, popularViewThreshold: 50, whatsappMinProducts: 10, whatsappClickThreshold: 10 } });
  const { register, handleSubmit, reset, watch } = form;
  useEffect(() => { if (query.data) { reset(query.data); setLogoPreview(query.data.logo ?? ''); setHeroPreview(query.data.heroImage ?? ''); } }, [query.data, reset]);
  const accentWatch = watch('accentColor') || '#ed671c';
  const submit = (data: SettingsInput) => { const { adminPassword, ...rest } = data; update.mutate({ data: { ...rest, logo: logoPreview || rest.logo, heroImage: heroPreview || rest.heroImage || null, ...(adminPassword ? { adminPassword } : {}) } }, { onSuccess: (saved) => { reset({ ...saved, adminPassword: '' }); setLogoPreview(saved.logo ?? ''); setHeroPreview(saved.heroImage ?? ''); qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() }); toast({ title: 'Paramètres enregistrés' }); }, onError: () => toast({ title: 'Échec de l\'enregistrement des paramètres', variant: 'destructive' }) }); };
  const uploadLogo = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setLogoPreview(String(reader.result)); reader.readAsDataURL(file); };
  const uploadHero = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setHeroPreview(String(reader.result)); reader.readAsDataURL(file); };
  if (query.isLoading) return <><PageHeader title="Paramètres" description="Configurez les informations de votre boutique et votre compte administrateur." /><div className="panel"><SkeletonRows count={4} /></div></>;
  if (query.isError) return <><PageHeader title="Paramètres" description="Configurez les informations de votre boutique et votre compte administrateur." /><QueryError retry={() => query.refetch()} /></>;
  return <><PageHeader title="Paramètres" description="Configurez les informations de votre boutique et votre compte administrateur." /><Form {...form}><form onSubmit={handleSubmit(submit)} className="settings-layout"><section className="panel form-panel"><h2>Informations de la boutique</h2><label className="field"><span>Nom de la boutique</span><input data-testid="input-settings-store-name" {...register('storeName')} /></label><label className="field"><span>Logo de la boutique</span><div className="logo-upload"><div className="settings-logo">{logoPreview ? <img src={logoPreview} alt="Logo de la boutique" /> : <img src={logo} alt="ACHAT+" />}</div><label className="button button-outline" htmlFor="settings-logo"><UploadCloud size={15} /> Changer le logo<input id="settings-logo" data-testid="input-settings-logo" type="file" accept="image/*" onChange={uploadLogo} /></label></div></label><label className="field"><span>Numéro WhatsApp</span><input data-testid="input-settings-whatsapp" {...register('whatsapp')} placeholder="+237 6xx xxx xxx" /></label><label className="field"><span>Description de la boutique</span><textarea data-testid="input-settings-description" {...register('description')} rows={5} /></label><label className="field"><span>Barre d'annonce</span><input data-testid="input-settings-announcement" {...register('announcement')} placeholder="Ex : Livraison offerte ce week-end à Douala" /><small className="field-hint">Texte affiché dans la bannière du haut de la boutique.</small></label><label className="field"><span>Arrondi des prix de vente</span><select data-testid="select-settings-rounding" {...register('roundingRule')}><option value="none">Aucun (prix exact)</option><option value="500">Arrondir aux 500 FCFA</option><option value="1000">Arrondir aux 1 000 FCFA</option></select><small className="field-hint">Le prix calculé (coût × marge) est arrondi avant publication.</small></label></section><section className="panel form-panel"><h2>Sections produits (accueil)</h2><div className="form-grid"><label className="field"><span>« Les plus vendus » — produits distincts requis</span><input data-testid="input-settings-selling-min" type="number" min="0" {...register('sellingMinProducts', { valueAsNumber: true })} /><small className="field-hint">La section s'affiche si au moins ce nombre de produits différents ont été commandés.</small></label><label className="field"><span>« Les plus populaires » — produits distincts requis</span><input data-testid="input-settings-popular-min" type="number" min="0" {...register('popularMinProducts', { valueAsNumber: true })} /><small className="field-hint">La section s'affiche si au moins ce nombre de produits dépassent le seuil de vues.</small></label><label className="field"><span>Seuil de vues pour « Les plus populaires »</span><input data-testid="input-settings-popular-views" type="number" min="0" {...register('popularViewThreshold', { valueAsNumber: true })} placeholder="50" /><small className="field-hint">Un produit qualifie comme populaire à partir de ce nombre de vues (ex : 50, 20 ou 10).</small></label><label className="field"><span>Seuil de clics WhatsApp pour « Les plus demandés »</span><input data-testid="input-settings-whatsapp-threshold" type="number" min="0" {...register('whatsappClickThreshold', { valueAsNumber: true })} placeholder="10" /><small className="field-hint">Un produit qualifie comme demandé à partir de ce nombre de clics sur le bouton WhatsApp.</small></label></div></section><section className="panel form-panel"><h2>Apparence & bannière</h2><label className="field"><span>Couleur d'accent</span><div className="accent-field"><span className="accent-swatch" style={{ background: accentWatch }} aria-hidden="true" /><input data-testid="input-settings-accent" {...register('accentColor')} placeholder="#ed671c" /><input data-testid="color-settings-accent" type="color" {...register('accentColor')} aria-label="Choisir la couleur d'accent" /></div><small className="field-hint">Appliquée à la boutique publique (boutons, liens, promotions).</small></label><label className="field field-checkbox"><span className="checkbox-line"><input data-testid="input-settings-hero-enabled" type="checkbox" {...register('heroEnabled')} /><span>Activer ma bannière personnalisée</span></span><small className="field-hint">Désactivée : la bannière par défaut de ACHAT+ s'affiche.</small></label><label className="field"><span>Image de la bannière (accueil)</span><div className="logo-upload"><div className="settings-logo">{heroPreview ? <img src={heroPreview} alt="Aperçu de la bannière" /> : <div className="hero-placeholder"><Zap size={16} /> Aucune image</div>}</div><label className="button button-outline" htmlFor="settings-hero"><UploadCloud size={15} /> Changer l'image<input id="settings-hero" data-testid="input-settings-hero" type="file" accept="image/*" onChange={uploadHero} /></label>{heroPreview && <button type="button" className="button button-outline" onClick={() => setHeroPreview('')} data-testid="button-settings-hero-clear"><X size={14} /> Retirer</button>}</div></label><label className="field"><span>Titre de la bannière</span><input data-testid="input-settings-hero-title" {...register('heroTitle')} placeholder="Ex : Les bonnes trouvailles, sans détour." /></label><label className="field"><span>Sous-titre de la bannière</span><input data-testid="input-settings-hero-subtitle" {...register('heroSubtitle')} placeholder="Ex : Mode, accessoires et essentiels du quotidien." /></label><label className="field"><span>Texte du bouton</span><input data-testid="input-settings-hero-cta" {...register('heroCtaText')} placeholder="Voir la sélection" /></label></section><section className="panel form-panel"><h2>Administrateur</h2><label className="field"><span>Nom de l'administrateur</span><input data-testid="input-settings-admin-name" {...register('adminName')} /></label><label className="field"><span>Adresse email</span><input data-testid="input-settings-admin-email" type="email" {...register('adminEmail')} /></label><label className="field"><span>Mot de passe</span><input data-testid="input-settings-admin-password" type="password" autoComplete="new-password" {...register('adminPassword')} placeholder="Laisser vide pour conserver" /><small className="field-hint">Utilisé pour vous connecter à cet espace.</small></label><div className="settings-note"><Zap size={17} /><span>Ces informations sont utilisées pour les communications et les commandes reçues via WhatsApp.</span></div></section><div className="form-actions"><span className="save-hint">{update.isSuccess && <><CircleCheck size={15} /> Modifications enregistrées</>}</span><button type="submit" data-testid="button-save-settings" className="button button-primary" disabled={update.isPending}>{update.isPending ? <Loader2 className="spin" size={16} /> : <Check size={16} />} Enregistrer les modifications</button></div></form></Form></>;
}

function ConfirmDialog({ title, detail, loading, onCancel, onConfirm }: { title: string; detail: string; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="dialog-backdrop" role="dialog" aria-modal="true"><div className="confirm-dialog"><button className="dialog-close" onClick={onCancel} data-testid="button-close-confirm"><X size={18} /></button><div className="confirm-icon"><Trash2 size={20} /></div><h2>{title}</h2><p>{detail}</p><div className="dialog-actions"><button className="button button-outline" onClick={onCancel} data-testid="button-cancel-confirm">Annuler</button><button className="button button-danger" onClick={onConfirm} disabled={loading} data-testid="button-confirm-delete">{loading ? <Loader2 className="spin" size={15} /> : <Trash2 size={15} />} Supprimer</button></div></div></div>;
}

function Router({ onLogout }: { onLogout: () => void }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AdminShell onLogout={onLogout}><Switch><Route path="/" component={Dashboard} /><Route path="/dashboard" component={Dashboard} /><Route path="/products/new" component={() => <ProductForm />} /><Route path="/products/:id/edit" component={() => <ProductForm edit />} /><Route path="/products" component={Products} /><Route path="/categories/new" component={() => <CategoryForm />} /><Route path="/categories/:id/edit" component={() => <CategoryForm edit />} /><Route path="/categories" component={Categories} /><Route path="/suppliers/new" component={() => <SupplierForm />} /><Route path="/suppliers/:id/edit" component={() => <SupplierForm edit />} /><Route path="/suppliers" component={Suppliers} /><Route path="/promotions/new" component={() => <PromotionForm />} /><Route path="/promotions/:id/edit" component={() => <PromotionForm edit />} /><Route path="/promotions" component={Promotions} /><Route path="/announcements/new" component={() => <AnnouncementForm />} /><Route path="/announcements/:id/edit" component={() => <AnnouncementForm edit />} /><Route path="/announcements" component={Announcements} /><Route path="/reviews" component={Reviews} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></AdminShell></ErrorBoundary>;
}

function App() {
  const [authed, setAuthed] = useState(() => Boolean(authToken.get()));
  useEffect(() => {
    setOnUnauthorized(() => { authToken.clear(); setAuthed(false); });
    return () => setOnUnauthorized(null);
  }, []);
  useEffect(() => {
    if (!authToken.get()) return;
    let mounted = true;
    api.verifyAuth().then((valid) => { if (mounted && !valid) { authToken.clear(); setAuthed(false); } });
    return () => { mounted = false; };
  }, [authed]);
  const logout = () => { authToken.clear(); setAuthed(false); };
  if (!authed) return <QueryClientProvider client={queryClient}><LoginPage onLogin={() => setAuthed(true)} /><Toaster /></QueryClientProvider>;
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router onLogout={logout} /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;