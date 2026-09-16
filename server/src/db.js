import 'dotenv/config';
import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/achatplus',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    dateAdded TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
    slug TEXT,
    description TEXT DEFAULT '',
    imageUrl TEXT,
    marginPercent INTEGER DEFAULT 20,
    parentId INTEGER
  );

  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    oldPrice REAL,
    description TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '[]',
    images TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'available',
    featured INTEGER NOT NULL DEFAULT 0,
    badge TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    keywords TEXT NOT NULL DEFAULT '[]',
    deliveryCities TEXT NOT NULL DEFAULT '[]',
    dateAdded TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
    brand TEXT DEFAULT '',
    supplierId INTEGER,
    supplierPrice REAL,
    marginPercent INTEGER DEFAULT 20,
    finalPrice REAL,
    stockStatus TEXT DEFAULT 'available',
    deliveryInfo TEXT DEFAULT '',
    warrantyInfo TEXT DEFAULT '',
    specifications TEXT DEFAULT '',
    isFlashSale INTEGER NOT NULL DEFAULT 0,
    flashSaleEndsAt TEXT,
    viewCount INTEGER NOT NULL DEFAULT 0,
    orderCount INTEGER NOT NULL DEFAULT 0,
    calculatedPrice REAL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer TEXT NOT NULL,
    phone TEXT NOT NULL,
    products TEXT NOT NULL DEFAULT '',
    amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    date TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
    source TEXT NOT NULL DEFAULT 'web'
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    storeName TEXT NOT NULL DEFAULT 'ACHAT+',
    logo TEXT,
    whatsapp TEXT NOT NULL DEFAULT '237677420606',
    description TEXT NOT NULL DEFAULT '',
    adminName TEXT NOT NULL DEFAULT 'Administrateur',
    adminEmail TEXT NOT NULL DEFAULT 'admin@achatplus.com',
    adminPassword TEXT NOT NULL DEFAULT 'achat123',
    accentColor TEXT NOT NULL DEFAULT '#ed671c',
    heroEnabled INTEGER NOT NULL DEFAULT 0,
    heroImage TEXT,
    heroTitle TEXT,
    heroSubtitle TEXT,
    heroCtaText TEXT,
    announcement TEXT DEFAULT '',
    roundingRule TEXT NOT NULL DEFAULT 'none',
    sellingMinProducts INTEGER DEFAULT 10,
    popularMinProducts INTEGER DEFAULT 10,
    popularViewThreshold INTEGER DEFAULT 50,
    whatsappMinProducts INTEGER DEFAULT 10,
    whatsappClickThreshold INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    productId INTEGER NOT NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    dateAdded TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS')),
    image TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT reviews_product_fk FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    productId INTEGER,
    kind TEXT NOT NULL,
    dateAdded TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    note TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    dateAdded TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    productId INTEGER,
    categoryName TEXT,
    discountPercent REAL NOT NULL DEFAULT 0,
    startDate TEXT,
    endDate TEXT,
    active INTEGER NOT NULL DEFAULT 0,
    dateAdded TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    imageUrl TEXT,
    linkUrl TEXT,
    bgColor TEXT DEFAULT '#ed671c',
    textColor TEXT DEFAULT '#ffffff',
    active INTEGER NOT NULL DEFAULT 1,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    dateAdded TEXT NOT NULL DEFAULT (to_char(now(), 'YYYY-MM-DD HH24:MI:SS'))
  );
`;

export async function initDb() {
  await pool.query('SELECT 1');
  await pool.query(SCHEMA);
  await pool.query(`
    INSERT INTO settings (id, storeName, logo, whatsapp, description, adminName, adminEmail)
    VALUES (1, 'ACHAT+', NULL, '237677420606', 'Boutique en ligne simple et fiable au Cameroun.', 'Administrateur', 'admin@achatplus.com')
    ON CONFLICT (id) DO NOTHING
  `);
  return pool;
}