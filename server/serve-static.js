import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const root = path.resolve(process.env.ROOT || path.join(__dirname, '..', 'achat-public', 'dist', 'public'));
const API_URL = process.env.API_URL || 'http://localhost:4000';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const isPublicRoot = /achat-public[\\/]/.test(root);

// ── OG meta per product ───────────────────────────────────────────
const productCache = new Map();

async function lookupProduct(slug) {
  if (productCache.has(slug)) return productCache.get(slug);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_URL}/api/products/${encodeURIComponent(slug)}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) { productCache.set(slug, null); return null; }
    const product = await res.json();
    productCache.set(slug, product);
    setTimeout(() => productCache.delete(slug), 30000);
    return product;
  } catch {
    productCache.set(slug, null);
    return null;
  }
}

function esc(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function injectProductMeta(html, slug, url) {
  const product = await lookupProduct(slug);
  if (!product) return html;
  const price = product.price != null ? `${new Intl.NumberFormat('fr-FR').format(product.price)} FCFA` : '';
  const image = product.images?.[0] || product.image || '';
  const store = product.name || '';
  const meta = [
    `<meta name="description" content="${esc(product.description || product.name)}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${esc(`${product.name} – ACHAT+`)}" />`,
    `<meta property="og:description" content="${esc(product.description || product.name)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:price:amount" content="${esc(product.price)}" />`,
    `<meta property="og:price:currency" content="XAF" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(`${product.name} – ACHAT+`)}" />`,
    `<meta name="twitter:description" content="${esc(product.description || product.name)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image,
      description: product.description,
      brand: { '@type': 'Brand', name: 'ACHAT+' },
      offers: { '@type': 'Offer', priceCurrency: 'XAF', price: product.price, availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
    })}</script>`,
  ].join('\n    ');
  return html.replace('<head>', `<head>\n    ${meta}`);
}

const BASE_TITLE = 'ACHAT+ – Le shopping simple, au quotidien';
const BASE_DESC = 'ACHAT+ est votre boutique en ligne fiable au Cameroun : mode, tech, maison et plus. Livraison à Yaoundé et Douala, commande rapide par WhatsApp.';

function injectBaseMeta(html) {
  const meta = [
    `<title>${BASE_TITLE}</title>`,
    `<meta name="description" content="${BASE_DESC}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${BASE_TITLE}" />`,
    `<meta property="og:description" content="${BASE_DESC}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${BASE_TITLE}" />`,
    `<meta name="twitter:description" content="${BASE_DESC}" />`,
  ].join('\n    ');
  return html.replace('<head>', `<head>\n    ${meta}`);
}

http
  .createServer(async (req, res) => {
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    const isProductRoute = isPublicRoot && /^\/products\/[^/]+$/.test(urlPath);
    const extension = path.extname(urlPath);
    let filePath = path.join(root, urlPath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!path.extname(filePath) || filePath.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html');
    }
    let isHtml = extension === '.html' || filePath.endsWith('index.html') || (isProductRoute && extension === '');
    let body;
    if (isPublicRoot && (filePath.endsWith('index.html') || (isProductRoute && !path.extname(filePath)))) {
      let html = fs.readFileSync(filePath, 'utf8');
      if (isProductRoute) {
        const slug = urlPath.split('/')[2];
        const host = req.headers.host || 'localhost';
        const url = `http://${host}${req.url}`;
        html = await injectProductMeta(html, slug, url);
      } else if (filePath.endsWith('index.html')) {
        html = injectBaseMeta(html);
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(port, '0.0.0.0', () => {
    console.log(`Serving ${root} on http://localhost:${port}`);
  });
