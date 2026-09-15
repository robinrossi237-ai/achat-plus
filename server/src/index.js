import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDb, pool } from './db.js';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const q = async (sql, params = []) => (await pool.query(sql, params)).rows;
const one = async (sql, params = []) => (await pool.query(sql, params)).rows[0];
const go = async (sql, params = []) => pool.query(sql, params);
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// ---- Auth (admin) ----
const AUTH_SECRET = process.env.ADMIN_SECRET || 'achat-plus-local-secret';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const signToken = (payload) => crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return res.status(401).json({ error: 'Non autorisé' });
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (sig !== signToken(payload) || data.exp < Date.now()) {
      return res.status(401).json({ error: 'Session expirée' });
    }
  } catch {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  next();
};

app.post('/api/auth/login', ah(async (req, res) => {
  const { password } = req.body || {};
  const row = await one('SELECT adminPassword FROM settings WHERE id = 1');
  const expected = row?.adminpassword ?? '';
  if (!password || password !== expected) return res.status(401).json({ error: 'Mot de passe incorrect' });
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  res.json({ token: `${payload}.${signToken(payload)}` });
}));

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ ok: true }));

const parseJson = (value, fallback) => {
  try { return JSON.parse(value); } catch { return fallback; }
};

const normalizeCategoryImages = (imageUrl, images) => {
  if (Array.isArray(images)) {
    const valid = images.filter(Boolean);
    if (valid.length) return JSON.stringify(valid);
    return null;
  }
  if (imageUrl != null) {
    if (typeof imageUrl === 'string' && imageUrl.trim().startsWith('[')) return imageUrl;
    return imageUrl || null;
  }
  return null;
};

const deriveStockStatus = (row) => {
  if (row.status !== 'available' || !row.stock) return 'out';
  if (row.stock <= 5) return 'low';
  return 'available';
};

// Règle d'arrondi commercial configurable (settings.roundingRule)
const applyRounding = (amount, roundingRule) => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (roundingRule === '500') return Math.ceil(n / 500) * 500;
  if (roundingRule === '1000') return Math.ceil(n / 1000) * 1000;
  return Math.round(n);
};

// Chaîne de prix : grossiste → marge → prix calculé → arrondi → prix final
const computePriceChain = (row, catMargin, roundingRule) => {
  const sup = Number(row.supplierprice);
  const rawBase = Number.isFinite(sup) && sup > 0 ? sup : Number(row.price ?? 0);
  const baseNum = Number.isFinite(rawBase) ? rawBase : 0;
  const margin = row.marginpercent != null ? Number(row.marginpercent) : (catMargin ?? 20);
  const calculated = Math.round(baseNum * (1 + margin / 100));
  return { calculated, final: applyRounding(calculated, roundingRule), margin, roundingRule };
};

// ---- Promotions actives (fenêtre: active=1 ET dans [startDate, endDate] si renseigné) ----
const getActivePromotions = async () => {
  const now = new Date().toISOString();
  return q(`
    SELECT * FROM promotions WHERE active = 1
      AND (startDate IS NULL OR startDate = '' OR startDate <= $1)
      AND (endDate IS NULL OR endDate = '' OR endDate >= $2)
    ORDER BY id DESC
  `, [now, now]);
};

// Trouve la promo applicable à un produit (par productId, sinon par catégorie).
const findActivePromo = (p, promos) => {
  if (!promos.length) return null;
  let byProduct = null;
  let byCategory = null;
  const cat = p.category;
  for (const promo of promos) {
    const d = Number(promo.discountpercent) || 0;
    if (promo.productid != null && Number(promo.productid) === Number(p.id)) {
      if (!byProduct) byProduct = { id: promo.id, name: promo.name, discountPercent: d, type: 'product' };
    } else if (promo.categoryname != null && promo.categoryname !== '' && promo.categoryname === cat) {
      if (!byCategory) byCategory = { id: promo.id, name: promo.name, discountPercent: d, type: 'category' };
    }
  }
  return byProduct || byCategory;
};

// Applique la promo au prix final arrondi ; renvoie { promoPrice, discountPercent, promoName, promoId, promoType }.
const applyPromotion = (finalPrice, row, promos, roundingRule) => {
  const promo = findActivePromo(row, promos);
  if (!promo) return null;
  const rawPromoPrice = Math.round(finalPrice * (1 - promo.discountPercent / 100));
  const promoPrice = applyRounding(rawPromoPrice, roundingRule);
  const effectiveDiscount = finalPrice > 0 ? Math.round((1 - promoPrice / finalPrice) * 100) : 0;
  return {
    promoPrice,
    discountPercent: effectiveDiscount,
    promoName: promo.name,
    promoId: promo.id,
    promoType: promo.type,
  };
};

const rowsToMap = (...arrays) => arrays.flat().filter(Boolean);

const buildMaps = async (rows) => {
  const inactive = new Set((await q("SELECT name FROM categories WHERE status = 'inactive'")).map((r) => r.name));
  const cats = await q('SELECT name, id, marginPercent FROM categories');
  const catMargin = new Map(cats.map((r) => [r.name, r.marginpercent != null ? Number(r.marginpercent) : 20]));
  const catId = new Map(cats.map((r) => [r.name, r.id]));
  const sups = await q('SELECT id, name FROM suppliers');
  const supName = new Map(sups.map((r) => [Number(r.id), r.name]));
  const reviews = new Map();
  const ids = rows.map((r) => Number(r.id)).filter(Boolean);
  if (ids.length) {
    const stats = await q(
      `SELECT productid, ROUND(AVG(rating), 2)::float8 AS avg, COUNT(*)::int AS cnt
         FROM reviews WHERE status = 'approved' AND productId = ANY($1::int[])
         GROUP BY productId`,
      [ids]
    );
    for (const s of stats) reviews.set(Number(s.productid), s);
  }
  const promos = await getActivePromotions();
  const settingsRow = await one('SELECT roundingRule FROM settings WHERE id = 1');
  const roundingRule = settingsRow?.roundingrule || 'none';
  return { inactive, catMargin, catId, supName, reviews, promos, roundingRule };
};

const toProduct = (row, m) => {
  if (!row) return null;
  const cat = row.category || '';
  const chain = computePriceChain(row, m.catMargin.get(cat), m.roundingRule);
  const finalPrice = chain.final;
  const promo = applyPromotion(finalPrice, row, m.promos, m.roundingRule);
  const stat = m.reviews.get(Number(row.id));
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    categoryId: m.catId.get(cat) ?? null,
    categoryName: row.category,
    brand: row.brand || '',
    price: row.price,
    oldPrice: row.oldprice ?? undefined,
    finalPrice,
    calculatedPrice: chain.calculated,
    roundingRule: chain.roundingRule,
    marginPercent: row.marginpercent ?? chain.margin,
    originalPrice: row.oldprice ?? (promo ? finalPrice : finalPrice),
    discountPercent: (row.oldprice && row.oldprice > finalPrice) ? Math.round((1 - finalPrice / row.oldprice) * 100) : 0,
    promoPrice: promo ? promo.promoPrice : null,
    promoDiscountPercent: promo ? promo.discountPercent : 0,
    promoName: promo ? promo.promoName : null,
    promoId: promo ? promo.promoId : null,
    promoType: promo ? promo.promoType : null,
    supplierPrice: row.supplierprice ?? null,
    supplierId: row.supplierid ?? null,
    supplierName: m.supName.get(Number(row.supplierid)) ?? null,
    description: row.description,
    details: parseJson(row.details, []),
    images: parseJson(row.images, []),
    stockStatus: row.stockstatus ? row.stockstatus : deriveStockStatus(row),
    stockQuantity: row.stock,
    stock: row.stock,
    status: row.status,
    available: row.status === 'available',
    featured: Boolean(row.featured),
    isFlashSale: Boolean(row.isflashsale),
    flashSaleEndsAt: row.flashsaleendsat ?? null,
    badge: row.badge ?? undefined,
    deliveryCities: parseJson(row.deliverycities, []),
    deliveryInfo: row.deliveryinfo || '',
    warrantyInfo: row.warrantyinfo || '',
    specifications: row.specifications || '',
    averageRating: stat ? Number(stat.avg) : null,
    reviewCount: stat ? Number(stat.cnt) : 0,
    viewCount: row.viewcount ?? 0,
    orderCount: row.ordercount ?? 0,
    tags: parseJson(row.tags, []),
    keywords: parseJson(row.keywords, []),
    dateAdded: row.dateadded,
    createdAt: row.dateadded,
  };
};

const toCategory = (row) => {
  if (!row) return null;
  let images = row.imageurl ? [row.imageurl] : [];
  if (Array.isArray(row.imageurl)) images = row.imageurl.filter(Boolean);
  else if (typeof row.imageurl === 'string') {
    const trimmed = row.imageurl.trim();
    if (trimmed.startsWith('[')) {
      const parsed = parseJson(trimmed, []);
      if (Array.isArray(parsed)) images = parsed.filter(Boolean);
    } else if (trimmed) {
      images = [trimmed];
    }
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: row.description || '',
    imageUrl: images[0] ?? null,
    images: images,
    icon: row.icon,
    marginPercent: row.marginpercent ?? 20,
    status: row.status,
    productCount: row.productCount ?? 0,
    dateAdded: row.dateadded,
  };
};

const toOrder = (row) => row ? {
  id: row.id,
  customer: row.customer,
  customerName: row.customer,
  phone: row.phone,
  customerPhone: row.phone,
  products: row.products,
  productName: row.products,
  amount: row.amount,
  totalPrice: row.amount,
  status: row.status,
  date: row.date,
  source: row.source,
} : null;

const CATEGORY_SQL = `
  SELECT c.*, (SELECT COUNT(*)::int FROM products p WHERE p.category = c.name) AS "productCount"
  FROM categories c
`;

const toAnnouncement = (row) => row ? {
  id: row.id,
  title: row.title,
  body: row.body || '',
  imageUrl: row.imageurl ?? null,
  linkUrl: row.linkurl ?? null,
  bgColor: row.bgcolor,
  textColor: row.textcolor,
  active: Boolean(row.active),
  sortOrder: row.sortorder ?? 0,
  dateAdded: row.dateadded,
} : null;

const toSupplier = (row) => row ? {
  id: row.id,
  name: row.name,
  email: row.email || '',
  phone: row.phone || '',
  address: row.address || '',
  note: row.note || '',
  status: row.status,
  dateAdded: row.dateadded,
} : null;

const toPromotion = (row) => row ? {
  id: row.id,
  name: row.name,
  productId: row.productid ?? null,
  categoryName: row.categoryname ?? null,
  discountPercent: Number(row.discountpercent) || 0,
  startDate: row.startdate ?? null,
  endDate: row.enddate ?? null,
  active: Boolean(row.active),
  dateAdded: row.dateadded,
} : null;

// ---- Products ----
app.get('/api/products', ah(async (req, res) => {
  const { search = '', category = '', status = '', page = '1', limit = '50', minPrice, maxPrice, stockStatus, onPromotion, sort = '' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  if (search) {
    conditions.push(`(name ILIKE $${params.length + 1} OR category ILIKE $${params.length + 2} OR description ILIKE $${params.length + 3})`);
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (status) { conditions.push(`status = $${params.length + 1}`); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await q(`SELECT * FROM products ${where} ORDER BY dateAdded DESC, id DESC`, params);
  const maps = await buildMaps(rows);

  const minP = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
  const maxP = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
  const asPromo = onPromotion === 'true' || onPromotion === '1';

  const items = rows.map((r) => toProduct(r, maps)).filter((p) => {
    if (maps.inactive.has(p.category)) return false;
    if (category && p.category !== category) return false;
    const display = p.promoPrice ?? p.finalPrice;
    if (minP !== null && display < minP) return false;
    if (maxP !== null && display > maxP) return false;
    if (stockStatus && p.stockStatus !== stockStatus) return false;
    if (asPromo) {
      const promo = p.promoPrice != null && p.originalPrice != null && Number(p.promoPrice) < Number(p.originalPrice);
      if (!promo) return false;
    }
    return true;
  });

  const total = items.length;

  if (sort === 'price_asc') items.sort((a, b) => (a.promoPrice ?? a.finalPrice) - (b.promoPrice ?? b.finalPrice));
  else if (sort === 'price_desc') items.sort((a, b) => (b.promoPrice ?? b.finalPrice) - (a.promoPrice ?? a.finalPrice));
  else if (sort === 'stock_asc') items.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  else if (sort === 'stock_desc') items.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
  else if (sort === 'date_asc') items.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
  else if (sort === 'date_desc') items.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  const paginated = items.slice(offset, offset + limitNum);

  res.json({
    items: paginated,
    total,
    page: pageNum,
    limit: limitNum,
    pageCount: Math.max(1, Math.ceil(total / limitNum)),
  });
}));

app.get('/api/products/all', ah(async (req, res) => {
  const rows = await q('SELECT * FROM products ORDER BY id DESC');
  const maps = await buildMaps(rows);
  res.json(rows.map((r) => toProduct(r, maps)));
}));

// ---- Rating summary (doit précéder /api/products/:id) ----
app.get('/api/products/rating-summary', ah(async (req, res) => {
  const rows = await q(`
    SELECT productId::int AS productId, ROUND(AVG(rating), 2)::float8 AS average, COUNT(*)::int AS count
    FROM reviews WHERE status = 'approved'
    GROUP BY productId
  `);
  res.json(rows);
}));

app.get('/api/products/featured', ah(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const rows = await q("SELECT * FROM products WHERE featured = 1 AND status = 'available' ORDER BY id DESC LIMIT $1", [limit]);
  const maps = await buildMaps(rows);
  res.json(rows.map((r) => toProduct(r, maps)).filter((p) => !maps.inactive.has(p.category)));
}));

app.get('/api/products/flash-sale', ah(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const rows = await q("SELECT * FROM products WHERE isFlashSale = 1 AND status = 'available' ORDER BY id DESC LIMIT $1", [limit]);
  const maps = await buildMaps(rows);
  res.json(rows.map((r) => toProduct(r, maps)).filter((p) => !maps.inactive.has(p.category)));
}));

app.get('/api/products/top', ah(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const rows = await q("SELECT * FROM products WHERE status = 'available' ORDER BY orderCount DESC, viewCount DESC, id DESC LIMIT $1", [limit]);
  const maps = await buildMaps(rows);
  res.json(rows.map((r) => toProduct(r, maps)).filter((p) => !maps.inactive.has(p.category)));
}));

// ---- Sections d'accueil (les plus vendus / populaires / demandés) ----
app.get('/api/products/home-sections', ah(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const sRow = await one('SELECT * FROM settings WHERE id = 1');
  const sellingMinProducts = Number(sRow?.sellingminproducts ?? 10);
  const popularMinProducts = Number(sRow?.popularminproducts ?? 10);
  const popularViewThreshold = Number(sRow?.popularviewthreshold ?? 50);
  const whatsappMinProducts = Number(sRow?.whatsappminproducts ?? 10);
  const whatsappClickThreshold = Number(sRow?.whatsappclickthreshold ?? 10);

  // Les plus vendus : produits avec au moins 1 commande, section si >= sellingMinProducts produits distincts
  const soldRows = await q("SELECT * FROM products WHERE status = 'available' AND orderCount > 0 ORDER BY orderCount DESC, viewCount DESC, id DESC LIMIT $1", [limit]);
  const soldCnt = await one('SELECT COUNT(*)::int AS c FROM products WHERE orderCount > 0');
  const soldVisible = Number(soldCnt?.c) >= sellingMinProducts;

  // Les plus populaires : produits dont les vues dépassent le seuil, section si >= popularMinProducts distincts
  const viewedRows = await q('SELECT * FROM products WHERE status = \'available\' AND viewCount >= $1 ORDER BY viewCount DESC, id DESC LIMIT $2', [popularViewThreshold, limit]);
  const viewedCnt = await one('SELECT COUNT(*)::int AS c FROM products WHERE viewCount >= $1', [popularViewThreshold]);
  const popularVisible = Number(viewedCnt?.c) >= popularMinProducts;

  // Les plus demandés : produits dont les clics WhatsApp dépassent le seuil
  const whatsappRows = await q(`
    SELECT p.*, COUNT(c.id)::int AS waClicks
    FROM products p LEFT JOIN clicks c ON c.productId = p.id AND c.kind = 'whatsapp'
    WHERE p.status = 'available'
    GROUP BY p.id HAVING COUNT(c.id) >= $1
    ORDER BY waClicks DESC, p.id DESC LIMIT $2
  `, [whatsappClickThreshold, limit]);
  const whatsappCnt = await one(`
    SELECT COUNT(*)::int AS c FROM (
      SELECT p.id, COUNT(c.id) AS wa
      FROM products p LEFT JOIN clicks c ON c.productId = p.id AND c.kind = 'whatsapp'
      GROUP BY p.id HAVING COUNT(c.id) >= $1
    ) AS t
  `, [whatsappClickThreshold]);
  const whatsappVisible = Number(whatsappCnt?.c) >= whatsappMinProducts;

  const maps = await buildMaps(rowsToMap(soldRows, viewedRows, whatsappRows));
  const isPublic = (p) => !maps.inactive.has(p.category);
  res.json({
    topSold: soldVisible ? soldRows.map((r) => toProduct(r, maps)).filter(isPublic) : [],
    soldVisible,
    topViewed: popularVisible ? viewedRows.map((r) => toProduct(r, maps)).filter(isPublic) : [],
    popularVisible,
    topWhatsapp: whatsappVisible ? whatsappRows.map((r) => toProduct(r, maps)).filter(isPublic) : [],
    whatsappVisible,
    thresholds: {
      sellingMinProducts,
      popularMinProducts,
      popularViewThreshold,
      whatsappMinProducts,
      whatsappClickThreshold,
    },
  });
}));

app.get('/api/products/:id/related', ah(async (req, res) => {
  const num = parseInt(req.params.id, 10);
  const product = await one('SELECT * FROM products WHERE id = $1', [num]);
  if (!product) return res.json([]);
  const rows = await q("SELECT * FROM products WHERE category = $1 AND id != $2 AND status = 'available' ORDER BY id DESC LIMIT 6", [product.category, num]);
  const maps = await buildMaps(rows);
  res.json(rows.map((r) => toProduct(r, maps)));
}));

// Suggestions intelligentes :
//  - frequentlyBoughtTogether : produits souvent vus/commandés/partagés avec le produit courant (co-occurrence de clics).
//  - mayAlsoLike : produits populaires de la même catégorie (filtrés de ceux déjà proposés).
app.get('/api/products/:id/recommended', ah(async (req, res) => {
  const num = parseInt(req.params.id, 10);
  const product = await one('SELECT * FROM products WHERE id = $1', [num]);
  if (!product) return res.json({ frequentlyBoughtTogether: [], mayAlsoLike: [] });

  // Co-occurrence : produits qui partagent des clics de même nature avec le produit courant,
  // pondérés par le nombre de clics.
  const togetherRows = await q(`
    SELECT c2.productId::int AS pid, COUNT(*)::int AS score
    FROM clicks c1
    JOIN clicks c2 ON c1.kind = c2.kind AND c1.productId = $1 AND c2.productId != $2
    WHERE c1.kind IN ('view', 'order', 'favorite', 'whatsapp')
    GROUP BY c2.productId
    ORDER BY score DESC
    LIMIT 12
  `, [num, num]);
  const togetherIds = togetherRows.map((r) => r.pid);
  let frequentlyBoughtTogether = [];
  const maps = await buildMaps([]);
  if (togetherIds.length) {
    const togetherProds = await q("SELECT * FROM products WHERE id = ANY($1::int[]) AND status = 'available'", [togetherIds]);
    const byId = new Map(togetherProds.map((p) => [Number(p.id), p]));
    frequentlyBoughtTogether = togetherIds
      .map((pid) => byId.get(Number(pid)))
      .filter(Boolean)
      .map((r) => toProduct(r, maps))
      .filter((p) => !maps.inactive.has(p.category))
      .slice(0, 10);
  }

  // Vous aimerez aussi : produits de la même catégorie, par popularité, hors déjà listés.
  const excluded = new Set(togetherIds);
  excluded.add(num);
  const excludedArr = Array.from(excluded);
  const likeSql = `SELECT * FROM products WHERE status = 'available' AND category = $1 ${excludedArr.length ? 'AND NOT (id = ANY($2::int[]))' : ''} ORDER BY orderCount DESC, viewCount DESC, id DESC LIMIT 12`;
  const likeParams = excludedArr.length ? [product.category, excludedArr] : [product.category];
  const likeRows = await q(likeSql, likeParams);
  const mayAlsoLike = likeRows.map((r) => toProduct(r, maps)).filter((p) => !maps.inactive.has(p.category)).slice(0, 10);

  res.json({ frequentlyBoughtTogether, mayAlsoLike });
}));

app.get('/api/products/:id', ah(async (req, res) => {
  const num = parseInt(req.params.id, 10);
  const row = await one('SELECT * FROM products WHERE id = $1 OR slug = $2', [num, req.params.id]);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  await go('UPDATE products SET viewCount = viewCount + 1 WHERE id = $1', [row.id]);
  const maps = await buildMaps([row]);
  res.json(toProduct({ ...row, viewcount: (row.viewcount || 0) + 1 }, maps));
}));

app.post('/api/products', requireAuth, ah(async (req, res) => {
  const { name, category, price, status = 'available', description = '', details = [], images = [], linked: oldPrice, featured = false, badge, stock = 0, tags = [], keywords = [], deliveryCities = [], brand = '', supplierPrice, marginPercent, supplierId, deliveryInfo = '', warrantyInfo = '', specifications = '', isFlashSale = false, flashSaleEndsAt } = req.body || {};
  if (!name || !category || price == null) return res.status(400).json({ error: 'name, category and price are required' });
  const slug = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`;
  const cats = await q('SELECT name, marginPercent FROM categories');
  const catMargin = new Map(cats.map((c) => [c.name, c.marginpercent != null ? Number(c.marginpercent) : 20]));
  const resolvedMargin = marginPercent != null ? Number(marginPercent) : (catMargin.get(category) ?? 20);
  const sRow = await one('SELECT roundingRule FROM settings WHERE id = 1');
  const roundingRule = sRow?.roundingrule || 'none';
  const baseNum = Number(supplierPrice ?? price ?? 0);
  const calculated = Math.round(baseNum * (1 + resolvedMargin / 100));
  const finalPrice = applyRounding(calculated, roundingRule);
  const result = await go(`
    INSERT INTO products (name, slug, category, brand, price, oldPrice, calculatedPrice, finalPrice, supplierPrice, marginPercent, supplierId, description, details, images, status, featured, badge, stock, tags, keywords, deliveryCities, deliveryInfo, warrantyInfo, specifications, isFlashSale, flashSaleEndsAt)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    RETURNING id
  `, [
    name, slug, category, brand, Number(price), oldPrice != null ? Number(oldPrice) : null, calculated, finalPrice,
    supplierPrice != null ? Number(supplierPrice) : null, resolvedMargin,
    supplierId != null ? Number(supplierId) : null, description, JSON.stringify(details), JSON.stringify(images), status,
    featured ? 1 : 0, badge ?? null, Number(stock) || 0,
    JSON.stringify(tags), JSON.stringify(keywords), JSON.stringify(deliveryCities), deliveryInfo, warrantyInfo, specifications,
    isFlashSale ? 1 : 0, flashSaleEndsAt ?? null
  ]);
  const row = await one('SELECT * FROM products WHERE id = $1', [result.rows[0].id]);
  const maps = await buildMaps([row]);
  res.status(201).json(toProduct(row, maps));
}));

app.put('/api/products/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await one('SELECT * FROM products WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const b = req.body || {};
  const newPrice = b.price != null ? Number(b.price) : existing.price;
  const newSupplierPrice = b.supplierPrice !== undefined ? (b.supplierPrice != null ? Number(b.supplierPrice) : null) : existing.supplierprice;
  const newMargin = b.marginPercent !== undefined ? (b.marginPercent != null ? Number(b.marginPercent) : null) : existing.marginpercent;
  const cats = await q('SELECT name, marginPercent FROM categories');
  const catMargin = new Map(cats.map((c) => [c.name, c.marginpercent != null ? Number(c.marginpercent) : 20]));
  const sRow = await one('SELECT roundingRule FROM settings WHERE id = 1');
  const roundingRule = sRow?.roundingrule || 'none';
  const resolvedMargin = newMargin != null ? newMargin : (catMargin.get(b.category ?? existing.category) ?? 20);
  const baseNum = newSupplierPrice != null ? newSupplierPrice : newPrice;
  const calculated = Math.round(baseNum * (1 + resolvedMargin / 100));
  const finalPrice = applyRounding(calculated, roundingRule);
  const merged = {
    name: b.name ?? existing.name,
    category: b.category ?? existing.category,
    brand: b.brand !== undefined ? b.brand : existing.brand,
    price: newPrice,
    oldPrice: b.oldPrice !== undefined ? (b.oldPrice != null ? Number(b.oldPrice) : null) : existing.oldprice,
    calculatedPrice: calculated,
    finalPrice,
    supplierPrice: newSupplierPrice,
    marginPercent: resolvedMargin,
    supplierId: b.supplierId !== undefined ? (b.supplierId != null ? Number(b.supplierId) : null) : existing.supplierid,
    description: b.description ?? existing.description,
    details: b.details ?? parseJson(existing.details, []),
    images: b.images ?? parseJson(existing.images, []),
    status: b.status ?? existing.status,
    featured: b.featured !== undefined ? (b.featured ? 1 : 0) : existing.featured,
    badge: b.badge !== undefined ? (b.badge || null) : existing.badge,
    stock: b.stock != null ? Number(b.stock) : existing.stock,
    tags: b.tags ?? parseJson(existing.tags, []),
    keywords: b.keywords ?? parseJson(existing.keywords, []),
    deliveryCities: b.deliveryCities ?? parseJson(existing.deliverycities, []),
    deliveryInfo: b.deliveryInfo ?? existing.deliveryinfo,
    warrantyInfo: b.warrantyInfo ?? existing.warrantyinfo,
    specifications: b.specifications ?? existing.specifications,
    isFlashSale: b.isFlashSale !== undefined ? (b.isFlashSale ? 1 : 0) : existing.isflashsale,
    flashSaleEndsAt: b.flashSaleEndsAt !== undefined ? b.flashSaleEndsAt : existing.flashsaleendsat,
  };
  await go(`
    UPDATE products SET name=$1, category=$2, brand=$3, price=$4, oldPrice=$5, calculatedPrice=$6, finalPrice=$7, supplierPrice=$8, marginPercent=$9, supplierId=$10, description=$11, details=$12, images=$13, status=$14, featured=$15, badge=$16, stock=$17, tags=$18, keywords=$19, deliveryCities=$20, deliveryInfo=$21, warrantyInfo=$22, specifications=$23, isFlashSale=$24, flashSaleEndsAt=$25
    WHERE id=$26
  `, [
    merged.name, merged.category, merged.brand, merged.price, merged.oldPrice, merged.calculatedPrice, merged.finalPrice,
    merged.supplierPrice, merged.marginPercent, merged.supplierId,
    merged.description, JSON.stringify(merged.details), JSON.stringify(merged.images),
    merged.status, merged.featured, merged.badge, merged.stock,
    JSON.stringify(merged.tags), JSON.stringify(merged.keywords), JSON.stringify(merged.deliveryCities),
    merged.deliveryInfo, merged.warrantyInfo, merged.specifications, merged.isFlashSale, merged.flashSaleEndsAt,
    id
  ]);
  const row = await one('SELECT * FROM products WHERE id = $1', [id]);
  const maps = await buildMaps([row]);
  res.json(toProduct(row, maps));
}));

app.delete('/api/products/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await go('DELETE FROM products WHERE id = $1', [id]);
  res.json({ ok: true });
}));

// ---- Suppliers ----
app.get('/api/suppliers', ah(async (req, res) => {
  const rows = await q('SELECT * FROM suppliers ORDER BY id DESC');
  res.json(rows.map(toSupplier));
}));

app.post('/api/suppliers', requireAuth, ah(async (req, res) => {
  const { name, email = '', phone = '', address = '', note = '', status = 'active' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = await go('INSERT INTO suppliers (name, email, phone, address, note, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [name, email, phone, address, note, status]);
  const row = await one('SELECT * FROM suppliers WHERE id = $1', [result.rows[0].id]);
  res.status(201).json(toSupplier(row));
}));

app.put('/api/suppliers/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await one('SELECT * FROM suppliers WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'Supplier not found' });
  const b = req.body || {};
  const merged = {
    name: b.name ?? existing.name,
    email: b.email !== undefined ? b.email : existing.email,
    phone: b.phone !== undefined ? b.phone : existing.phone,
    address: b.address !== undefined ? b.address : existing.address,
    note: b.note !== undefined ? b.note : existing.note,
    status: b.status !== undefined ? b.status : existing.status,
  };
  await go('UPDATE suppliers SET name=$1, email=$2, phone=$3, address=$4, note=$5, status=$6 WHERE id=$7',
    [merged.name, merged.email, merged.phone, merged.address, merged.note, merged.status, id]);
  const row = await one('SELECT * FROM suppliers WHERE id = $1', [id]);
  res.json(toSupplier(row));
}));

app.delete('/api/suppliers/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await go('DELETE FROM suppliers WHERE id = $1', [id]);
  res.json({ ok: true });
}));

// ---- Promotions ----
app.get('/api/promotions', ah(async (req, res) => {
  const rows = await q('SELECT * FROM promotions WHERE active = 1 ORDER BY id DESC');
  const prodRows = [];
  for (const p of rows) {
    if (p.productid != null) {
      const row = await one('SELECT * FROM products WHERE id = $1', [p.productid]);
      if (row) prodRows.push(row);
    }
  }
  const maps = await buildMaps(prodRows);
  const byId = (id) => prodRows.find((r) => Number(r.id) === Number(id));
  const withProducts = rows.map((p) => {
    let product = null;
    if (p.productid != null) {
      const row = byId(p.productid);
      if (row) product = toProduct(row, maps);
    }
    return { ...toPromotion(p), product };
  });
  res.json(withProducts);
}));

app.post('/api/promotions', requireAuth, ah(async (req, res) => {
  const { name, productId = null, categoryName = null, discountPercent = 0, startDate = null, endDate = null, active = false } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = await go(
    'INSERT INTO promotions (name, productId, categoryName, discountPercent, startDate, endDate, active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [name, productId != null ? Number(productId) : null, categoryName != null && categoryName !== '' ? categoryName : null, Number(discountPercent) || 0, startDate ?? null, endDate ?? null, active ? 1 : 0]
  );
  const row = await one('SELECT * FROM promotions WHERE id = $1', [result.rows[0].id]);
  res.status(201).json(toPromotion(row));
}));

app.put('/api/promotions/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await one('SELECT * FROM promotions WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'Promotion not found' });
  const b = req.body || {};
  const merged = {
    name: b.name ?? existing.name,
    productId: b.productId !== undefined ? (b.productId != null ? Number(b.productId) : null) : existing.productid,
    categoryName: b.categoryName !== undefined ? (b.categoryName != null && b.categoryName !== '' ? b.categoryName : null) : existing.categoryname,
    discountPercent: b.discountPercent !== undefined ? Number(b.discountPercent) : existing.discountpercent,
    startDate: b.startDate !== undefined ? b.startDate : existing.startdate,
    endDate: b.endDate !== undefined ? b.endDate : existing.enddate,
    active: b.active !== undefined ? (b.active ? 1 : 0) : existing.active,
  };
  await go('UPDATE promotions SET name=$1, productId=$2, categoryName=$3, discountPercent=$4, startDate=$5, endDate=$6, active=$7 WHERE id=$8',
    [merged.name, merged.productId, merged.categoryName, merged.discountPercent, merged.startDate, merged.endDate, merged.active, id]);
  const row = await one('SELECT * FROM promotions WHERE id = $1', [id]);
  res.json(toPromotion(row));
}));

app.delete('/api/promotions/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await go('DELETE FROM promotions WHERE id = $1', [id]);
  res.json({ ok: true });
}));

// ---- Announcements ----
app.get('/api/announcements', ah(async (req, res) => {
  const rows = await q('SELECT * FROM announcements WHERE active = 1 ORDER BY sortOrder ASC, id DESC');
  res.json(rows.map(toAnnouncement));
}));

app.post('/api/announcements', requireAuth, ah(async (req, res) => {
  const { title, body = '', imageUrl = null, linkUrl = null, bgColor = '#ed671c', textColor = '#ffffff', active = true, sortOrder = 0 } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const result = await go(
    'INSERT INTO announcements (title, body, imageUrl, linkUrl, bgColor, textColor, active, sortOrder) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    [title, body, imageUrl, linkUrl, bgColor, textColor, active ? 1 : 0, Number(sortOrder) || 0]
  );
  const row = await one('SELECT * FROM announcements WHERE id = $1', [result.rows[0].id]);
  res.status(201).json(toAnnouncement(row));
}));

app.put('/api/announcements/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await one('SELECT * FROM announcements WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'Announcement not found' });
  const b = req.body || {};
  const merged = {
    title: b.title ?? existing.title,
    body: b.body !== undefined ? b.body : existing.body,
    imageUrl: b.imageUrl !== undefined ? b.imageUrl : existing.imageurl,
    linkUrl: b.linkUrl !== undefined ? b.linkUrl : existing.linkurl,
    bgColor: b.bgColor !== undefined ? b.bgColor : existing.bgcolor,
    textColor: b.textColor !== undefined ? b.textColor : existing.textcolor,
    active: b.active !== undefined ? (b.active ? 1 : 0) : existing.active,
    sortOrder: b.sortOrder !== undefined ? Number(b.sortOrder) : existing.sortorder,
  };
  await go('UPDATE announcements SET title=$1, body=$2, imageUrl=$3, linkUrl=$4, bgColor=$5, textColor=$6, active=$7, sortOrder=$8 WHERE id=$9',
    [merged.title, merged.body, merged.imageUrl, merged.linkUrl, merged.bgColor, merged.textColor, merged.active, merged.sortOrder, id]);
  const row = await one('SELECT * FROM announcements WHERE id = $1', [id]);
  res.json(toAnnouncement(row));
}));

app.delete('/api/announcements/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await go('DELETE FROM announcements WHERE id = $1', [id]);
  res.json({ ok: true });
}));

// ---- Categories ----
app.get('/api/categories', ah(async (req, res) => {
  const { search = '' } = req.query;
  const rows = search
    ? await q(`${CATEGORY_SQL} WHERE c.name ILIKE $1 ORDER BY c.name`, [`%${search}%`])
    : await q(`${CATEGORY_SQL} ORDER BY c.name`);
  res.json(rows.map(toCategory));
}));

app.post('/api/categories', requireAuth, ah(async (req, res) => {
  const { name, status = 'active', icon = '', slug, description = '', imageUrl = null, images, marginPercent = 20 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const storedImages = normalizeCategoryImages(imageUrl, images);
  const result = await go('INSERT INTO categories (name, slug, description, imageUrl, icon, marginPercent, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [name, finalSlug, description, storedImages, icon, Number(marginPercent) || 20, status]);
  const row = await one(`${CATEGORY_SQL} WHERE c.id = $1`, [result.rows[0].id]);
  res.status(201).json(toCategory(row));
}));

app.put('/api/categories/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await one('SELECT * FROM categories WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'Category not found' });
  const b = req.body || {};
  const name = b.name ?? existing.name;
  const status = b.status ?? existing.status;
  const icon = b.icon !== undefined ? b.icon : existing.icon;
  const slug = b.slug !== undefined ? b.slug : existing.slug;
  const description = b.description !== undefined ? b.description : existing.description;
  const imageUrl = b.images !== undefined ? normalizeCategoryImages(undefined, b.images) : (b.imageUrl !== undefined ? normalizeCategoryImages(b.imageUrl, undefined) : existing.imageurl);
  const marginPercent = b.marginPercent !== undefined ? Number(b.marginPercent) : existing.marginpercent;
  await go('UPDATE categories SET name=$1, status=$2, icon=$3, slug=$4, description=$5, imageUrl=$6, marginPercent=$7 WHERE id=$8',
    [name, status, icon, slug, description, imageUrl, marginPercent, id]);
  const row = await one(`${CATEGORY_SQL} WHERE c.id = $1`, [id]);
  res.json(toCategory(row));
}));

app.delete('/api/categories/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await go('DELETE FROM categories WHERE id = $1', [id]);
  res.json({ ok: true });
}));

app.get('/api/categories/by-slug/:slug', ah(async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase();
  const rows = await q(`${CATEGORY_SQL}`);
  const found = rows.find((c) => (c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) === slug);
  if (!found) return res.status(404).json({ error: 'Category not found' });
  res.json(toCategory(found));
}));

// ---- Orders ----
app.get('/api/orders', ah(async (req, res) => {
  const rows = await q('SELECT * FROM orders ORDER BY id DESC');
  res.json(rows.map(toOrder));
}));

app.post('/api/orders', ah(async (req, res) => {
  const { customer, phone, products, amount, status = 'new', source = 'web', items = [] } = req.body || {};
  const result = await go(`
    INSERT INTO orders (customer, phone, products, amount, status, source)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [customer || 'Client', phone || '', products || '', Number(amount) || 0, status, source]);

  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (item.productId && item.quantity) {
        await go('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [item.quantity, item.productId]);
      }
      if (item.productId) {
        await go('UPDATE products SET orderCount = orderCount + $1 WHERE id = $2', [Number(item.quantity) || 1, Number(item.productId)]);
      }
    }
  }

  const row = await one('SELECT * FROM orders WHERE id = $1', [result.rows[0].id]);
  res.status(201).json(toOrder(row));
}));

app.put('/api/orders/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await one('SELECT * FROM orders WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'Order not found' });
  const status = (req.body || {}).status ?? existing.status;
  await go('UPDATE orders SET status=$1 WHERE id=$2', [status, id]);
  const row = await one('SELECT * FROM orders WHERE id = $1', [id]);
  res.json(toOrder(row));
}));

app.delete('/api/orders/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await go('DELETE FROM orders WHERE id = $1', [id]);
  res.json({ ok: true });
}));

// ---- Settings ----
const toSettings = (row) => ({
  storeName: row.storename,
  logo: row.logo,
  whatsapp: row.whatsapp,
  description: row.description,
  adminName: row.adminname,
  adminEmail: row.adminemail,
  accentColor: row.accentcolor,
  heroEnabled: Boolean(row.heroenabled),
  heroImage: row.heroimage,
  heroTitle: row.herotitle,
  heroSubtitle: row.herosubtitle,
  heroCtaText: row.heroctatext,
  announcement: row.announcement,
  roundingRule: row.roundingrule || 'none',
  sellingMinProducts: Number(row.sellingminproducts ?? 10),
  popularMinProducts: Number(row.popularminproducts ?? 10),
  popularViewThreshold: Number(row.popularviewthreshold ?? 50),
  whatsappMinProducts: Number(row.whatsappminproducts ?? 10),
  whatsappClickThreshold: Number(row.whatsappclickthreshold ?? 10),
});

app.get('/api/settings', ah(async (req, res) => {
  const row = await one('SELECT * FROM settings WHERE id = 1');
  if (!row) return res.status(404).json({ error: 'Settings not found' });
  res.json(toSettings(row));
}));

app.put('/api/settings', requireAuth, ah(async (req, res) => {
  const existing = await one('SELECT * FROM settings WHERE id = 1');
  const b = req.body || {};
  const merged = {
    storeName: b.storeName ?? existing.storename,
    logo: b.logo !== undefined ? b.logo : existing.logo,
    whatsapp: b.whatsapp ?? existing.whatsapp,
    description: b.description ?? existing.description,
    adminName: b.adminName ?? existing.adminname,
    adminEmail: b.adminEmail ?? existing.adminemail,
    adminPassword: b.adminPassword ? b.adminPassword : existing.adminpassword,
    accentColor: b.accentColor || existing.accentcolor || '#ed671c',
    heroEnabled: b.heroEnabled !== undefined ? (b.heroEnabled ? 1 : 0) : existing.heroenabled,
    heroImage: b.heroImage !== undefined ? b.heroImage : existing.heroimage,
    heroTitle: b.heroTitle !== undefined ? b.heroTitle : existing.herotitle,
    heroSubtitle: b.heroSubtitle !== undefined ? b.heroSubtitle : existing.herosubtitle,
    heroCtaText: b.heroCtaText !== undefined ? b.heroCtaText : existing.heroctatext,
    announcement: b.announcement !== undefined ? b.announcement : existing.announcement,
    roundingRule: b.roundingRule !== undefined ? b.roundingRule : (existing.roundingrule || 'none'),
    sellingMinProducts: b.sellingMinProducts != null ? Number(b.sellingMinProducts) : Number(existing.sellingminproducts ?? 10),
    popularMinProducts: b.popularMinProducts != null ? Number(b.popularMinProducts) : Number(existing.popularminproducts ?? 10),
    popularViewThreshold: b.popularViewThreshold != null ? Number(b.popularViewThreshold) : Number(existing.popularviewthreshold ?? 50),
    whatsappMinProducts: b.whatsappMinProducts != null ? Number(b.whatsappMinProducts) : Number(existing.whatsappminproducts ?? 10),
    whatsappClickThreshold: b.whatsappClickThreshold != null ? Number(b.whatsappClickThreshold) : Number(existing.whatsappclickthreshold ?? 10),
  };
  await go(`
    UPDATE settings SET storeName=$1, logo=$2, whatsapp=$3, description=$4, adminName=$5, adminEmail=$6, adminPassword=$7, accentColor=$8, heroEnabled=$9, heroImage=$10, heroTitle=$11, heroSubtitle=$12, heroCtaText=$13, announcement=$14, roundingRule=$15, sellingMinProducts=$16, popularMinProducts=$17, popularViewThreshold=$18, whatsappMinProducts=$19, whatsappClickThreshold=$20 WHERE id=1
  `, [merged.storeName, merged.logo, merged.whatsapp, merged.description, merged.adminName, merged.adminEmail, merged.adminPassword, merged.accentColor, merged.heroEnabled, merged.heroImage, merged.heroTitle, merged.heroSubtitle, merged.heroCtaText, merged.announcement, merged.roundingRule, merged.sellingMinProducts, merged.popularMinProducts, merged.popularViewThreshold, merged.whatsappMinProducts, merged.whatsappClickThreshold]);
  const saved = await one('SELECT * FROM settings WHERE id = 1');
  res.json(toSettings(saved));
}));

// ---- Reviews ----
const REVIEW_SQL = `
  SELECT r.*, p.name AS "productName"
  FROM reviews r LEFT JOIN products p ON p.id = r.productId
`;

const toReview = (row) => row ? {
  id: row.id,
  productId: row.productid,
  productName: row.productName ?? null,
  author: row.author,
  authorName: row.author,
  rating: row.rating,
  comment: row.comment,
  approved: row.status === 'approved',
  status: row.status,
  image: row.image ?? null,
  verified: Boolean(row.verified),
  dateAdded: row.dateadded,
  createdAt: row.dateadded,
} : null;

app.get('/api/reviews', ah(async (req, res) => {
  const { productId, status = 'approved' } = req.query;
  const where = [];
  const params = [];
  if (productId) { where.push(`r.productId = $${params.length + 1}`); params.push(Number(productId)); }
  if (status && status !== 'all') { where.push(`r.status = $${params.length + 1}`); params.push(status); }
  const sql = REVIEW_SQL + (where.length ? ' WHERE ' + where.join(' AND ') : '');
  const rows = await q(sql + ' ORDER BY r.dateAdded DESC, r.id DESC', params);
  res.json(rows.map(toReview));
}));

app.post('/api/reviews', ah(async (req, res) => {
  const { productId, author, rating, comment, image } = req.body || {};
  const product = await one('SELECT id FROM products WHERE id = $1', [Number(productId)]);
  if (!product) return res.status(400).json({ error: 'Produit inconnu' });
  if (!author?.trim() || !comment?.trim()) return res.status(400).json({ error: 'Nom et commentaire requis' });
  const stars = Math.round(Number(rating));
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: 'Note entre 1 et 5' });
  const result = await go(
    `INSERT INTO reviews (productId, author, rating, comment, image, status) VALUES ($1, $2, $3, $4, $5, 'approved') RETURNING id`,
    [Number(productId), author.trim(), stars, comment.trim(), (image && String(image).trim()) || null]
  );
  const row = await one(`${REVIEW_SQL} WHERE r.id = $1`, [result.rows[0].id]);
  res.status(201).json(toReview(row));
}));

app.put('/api/reviews/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await one('SELECT * FROM reviews WHERE id = $1', [id]);
  if (!existing) return res.status(404).json({ error: 'Avis introuvable' });
  const b = req.body || {};
  const status = b.status ?? existing.status;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  const verified = b.verified !== undefined ? (b.verified ? 1 : 0) : existing.verified;
  await go('UPDATE reviews SET status=$1, verified=$2 WHERE id=$3', [status, verified, id]);
  const row = await one(`${REVIEW_SQL} WHERE r.id = $1`, [id]);
  res.json(toReview(row));
}));

app.delete('/api/reviews/:id', requireAuth, ah(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await go('DELETE FROM reviews WHERE id = $1', [id]);
  res.json({ ok: true });
}));

// ---- Analytics ----
app.post('/api/analytics/click', ah(async (req, res) => {
  const { productId, kind } = req.body || {};
  if (!['view', 'order', 'favorite', 'share', 'whatsapp'].includes(kind)) return res.status(400).json({ error: 'Type de clic invalide' });
  await go('INSERT INTO clicks (productId, kind) VALUES ($1, $2)', [productId != null ? Number(productId) : null, kind]);
  res.json({ ok: true });
}));

app.get('/api/analytics/public', ah(async (req, res) => {
  const row = await one("SELECT COUNT(*)::int AS c FROM clicks WHERE kind = 'whatsapp'");
  res.json({ whatsappClicks: row?.c ?? 0 });
}));

app.get('/api/analytics/clicks', requireAuth, ah(async (req, res) => {
  const kindLabels = { order: 'Commande lancée', whatsapp: 'Contact WhatsApp', view: 'Vue produit', favorite: 'Favori', share: 'Partage' };
  const recent = await q(`
    SELECT c.id, c.kind, c.productId::int AS "productId", p.name AS "productName", c.dateAdded
    FROM clicks c LEFT JOIN products p ON p.id = c.productId
    WHERE c.kind IN ('order', 'whatsapp', 'view', 'favorite', 'share')
    ORDER BY c.id DESC LIMIT 100
  `).then((rows) => rows.map((row) => ({ ...row, kindLabel: kindLabels[row.kind] || row.kind, dateAdded: row.dateadded })));
  const byProduct = await q(`
    SELECT c.productId::int AS "productId", p.name, p.images, p.price,
      SUM(CASE WHEN c.kind = 'order' THEN 1 ELSE 0 END)::int AS orders,
      SUM(CASE WHEN c.kind = 'whatsapp' THEN 1 ELSE 0 END)::int AS whatsapp,
      SUM(CASE WHEN c.kind = 'view' THEN 1 ELSE 0 END)::int AS views,
      SUM(CASE WHEN c.kind = 'favorite' THEN 1 ELSE 0 END)::int AS favorites,
      SUM(CASE WHEN c.kind = 'share' THEN 1 ELSE 0 END)::int AS shares,
      COUNT(*)::int AS total
    FROM clicks c LEFT JOIN products p ON p.id = c.productId
    WHERE c.productId IS NOT NULL
    GROUP BY c.productId, p.name, p.images, p.price
    ORDER BY orders DESC, total DESC LIMIT 20
  `).then((rows) => rows.map((row) => ({ ...row, name: row.name || `Produit #${row.productId}` })));
  res.json({ recent, byProduct });
}));

app.get('/api/analytics/summary', requireAuth, ah(async (req, res) => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const totals = {};
  for (const kind of ['view', 'order', 'favorite', 'share', 'whatsapp']) {
    totals[kind] = Number((await one('SELECT COUNT(*)::int AS c FROM clicks WHERE kind = $1', [kind]))?.c ?? 0);
    const weekStr = new Date(weekAgo).toISOString().replace('T', ' ').slice(0, 19);
    totals[`${kind}_week`] = Number((await one('SELECT COUNT(*)::int AS c FROM clicks WHERE kind = $1 AND dateAdded >= $2', [kind, weekStr]))?.c ?? 0);
  }
  const topOrders = await q(`
    SELECT c.productId::int AS "productId", p.name, COUNT(*)::int AS count
    FROM clicks c LEFT JOIN products p ON p.id = c.productId
    WHERE c.kind = 'order' AND c.productId IS NOT NULL
    GROUP BY c.productId, p.name ORDER BY count DESC LIMIT 5
  `);
  const pendingReviews = Number((await one("SELECT COUNT(*)::int AS c FROM reviews WHERE status = 'pending'"))?.c ?? 0);
  res.json({ totals, topOrders, pendingReviews });
}));

// ---- Dashboard summary ----
app.get('/api/dashboard/summary', ah(async (req, res) => {
  const productCount = Number((await one('SELECT COUNT(*)::int AS c FROM products'))?.c ?? 0);
  const availableProductCount = Number((await one("SELECT COUNT(*)::int AS c FROM products WHERE status = 'available'"))?.c ?? 0);
  const categoryCount = Number((await one('SELECT COUNT(*)::int AS c FROM categories'))?.c ?? 0);
  const orderCount = Number((await one('SELECT COUNT(*)::int AS c FROM orders'))?.c ?? 0);
  const totalRevenue = Number((await one("SELECT COALESCE(SUM(amount),0)::float8 AS s FROM orders"))?.s ?? 0);
  const lowStockCount = Number((await one("SELECT COUNT(*)::int AS c FROM products WHERE status = 'available' AND stock <= 5"))?.c ?? 0);
  const flashSaleCount = Number((await one('SELECT COUNT(*)::int AS c FROM products WHERE isFlashSale = 1'))?.c ?? 0);
  const reviewCount = Number((await one("SELECT COUNT(*)::int AS c FROM reviews WHERE status = 'approved'"))?.c ?? 0);
  const averageRating = Number((await one("SELECT ROUND(AVG(rating),2)::float8 AS a FROM reviews WHERE status = 'approved'"))?.a ?? null) || null;
  const recent = await q('SELECT * FROM products ORDER BY dateAdded DESC, id DESC LIMIT 5');
  const recentOrders = await q('SELECT * FROM orders ORDER BY id DESC LIMIT 8');
  const topProducts = await q('SELECT * FROM products WHERE orderCount > 0 ORDER BY orderCount DESC, viewCount DESC LIMIT 5');
  const maps = await buildMaps(recent.concat(topProducts));
  const ordersByStatus = await q('SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status');
  res.json({
    productCount, availableProductCount, categoryCount, orderCount, totalRevenue, lowStockCount,
    flashSaleCount, reviewCount, averageRating,
    recentProducts: recent.map((r) => toProduct(r, maps)),
    recentOrders: recentOrders.map(toOrder),
    topProducts: topProducts.map((r) => toProduct(r, maps)),
    ordersByStatus,
  });
}));

app.get('/api/stats/dashboard', requireAuth, ah(async (req, res) => {
  const topProductsRows = await q('SELECT * FROM products WHERE orderCount > 0 ORDER BY orderCount DESC, viewCount DESC LIMIT 5');
  const maps = await buildMaps(topProductsRows);
  const topProducts = topProductsRows.map((r) => toProduct(r, maps));
  const ordersByStatus = await q('SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status');
  const recentOrders = await q('SELECT * FROM orders ORDER BY id DESC LIMIT 8').then((rows) => rows.map(toOrder));
  const totalOrders = Number((await one('SELECT COUNT(*)::int AS c FROM orders'))?.c ?? 0);
  const totalRevenue = Number((await one("SELECT COALESCE(SUM(amount),0)::float8 AS s FROM orders"))?.s ?? 0);
  const averageOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  res.json({ totalOrders, totalRevenue, averageOrderValue, topProducts, ordersByStatus, recentOrders });
}));

// ── Static file serving (front-end SPAs) ──────────────────────────────────────
const publicDist = path.join(__dirname, '..', '..', 'Achat_Plus_Site_public', 'achat-plus', 'dist', 'public');
const adminDist  = path.join(__dirname, '..', '..', 'achat-plus-admin', 'dist', 'public');

// API 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint introuvable' });
});

// Admin static assets + SPA fallback
app.use('/admin', express.static(adminDist));
app.get('/admin', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(adminDist, 'index.html')));

// Public static assets + SPA fallback (catch-all)
app.use(express.static(publicDist));
app.get('*', (req, res) => res.sendFile(path.join(publicDist, 'index.html')));

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
initDb()
  .then(async () => {
    await seed();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ACHAT+ API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database startup failed:', err?.message || err);
    process.exit(1);
  });