import { pool } from './db.js';

const photo = (id, width = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

const products = [
  {
    slug: 'sac-cabas-camel',
    name: 'Sac cabas structuré',
    category: 'Mode',
    price: 18500,
    oldPrice: 22000,
    description: 'Un sac élégant et pratique pour accompagner vos journées, du bureau au week-end.',
    details: ['Format généreux et léger', 'Fermeture zippée sécurisée', 'Bandoulière ajustable incluse'],
    images: [photo(1152077), photo(1152078), photo(1152079)],
    status: 'available',
    featured: 1,
    badge: 'Promo',
    stock: 4,
    tags: ['promo', 'selection'],
    keywords: ['sac', 'cabas', 'camel', 'bureau'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
  {
    slug: 'casque-bluetooth-p9',
    name: 'Casque Bluetooth P9',
    category: 'Tech & accessoires',
    price: 15000,
    description: 'Un son clair et une autonomie confortable pour vos trajets, appels et playlists.',
    details: ['Autonomie jusqu’à 30 heures', 'Micro intégré pour les appels', 'Connexion Bluetooth 5.0'],
    images: [photo(3394650), photo(1649771), photo(1649770)],
    status: 'available',
    featured: 1,
    badge: 'Bestseller',
    stock: 8,
    tags: ['bestseller', 'selection'],
    keywords: ['audio', 'écoute', 'casque', 'bluetooth'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
  {
    slug: 'sneakers-urbaines',
    name: 'Sneakers urbaines',
    category: 'Mode',
    price: 25000,
    description: 'La paire facile à porter, pensée pour marcher avec style et confort.',
    details: ['Semelle souple et antidérapante', 'Doublure respirante', 'Tailles du 38 au 44'],
    images: [photo(2529148), photo(1462637), photo(1598505)],
    status: 'available',
    featured: 1,
    badge: 'Nouveau',
    stock: 3,
    tags: ['nouveau', 'selection'],
    keywords: ['chaussure', 'sport', 'sneaker', 'basket'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
  {
    slug: 'montre-homme-luxe',
    name: 'Montre homme classique',
    category: 'Tech & accessoires',
    price: 40000,
    description: 'Une silhouette intemporelle et un cadran lisible pour tous les jours.',
    details: ['Bracelet acier inoxydable', 'Mouvement quartz précis', 'Résistance aux éclaboussures'],
    images: [photo(190819), photo(277390), photo(47856)],
    status: 'available',
    featured: 1,
    stock: 2,
    tags: ['selection'],
    keywords: ['montre', 'homme', 'acier', 'accessoire'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
  {
    slug: 'lampe-design',
    name: 'Lampe design nomade',
    category: 'Maison',
    price: 12500,
    description: 'Une lumière douce pour créer une ambiance chaleureuse, partout à la maison.',
    details: ['Recharge USB-C', 'Trois intensités lumineuses', 'Jusqu’à 12 heures d’autonomie'],
    images: [photo(1112598), photo(112811), photo(1571747)],
    status: 'available',
    featured: 1,
    stock: 5,
    tags: ['selection'],
    keywords: ['lampe', 'lumière', 'maison', 'déco'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
  {
    slug: 'parfum-fleur-oranger',
    name: 'Eau de parfum Fleur d’oranger',
    category: 'Beauté',
    price: 18000,
    description: 'Une fragrance lumineuse et délicate, avec une note fraîche de fleur d’oranger.',
    details: ['Contenance 50 ml', 'Sillage doux et élégant', 'Flacon en verre'],
    images: [photo(965989), photo(965992), photo(965991)],
    status: 'available',
    badge: 'Nouveau',
    stock: 2,
    tags: ['nouveau'],
    keywords: ['parfum', 'femme', 'fragrance', 'fleur'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
  {
    slug: 'ecouteurs-sans-fil',
    name: 'Écouteurs sans fil Air',
    category: 'Tech & accessoires',
    price: 9500,
    description: 'Des écouteurs compacts avec boîtier de charge, simples à emporter.',
    details: ['Boîtier de recharge inclus', 'Commandes tactiles', 'Compatible Android et iOS'],
    images: [photo(3780681), photo(1649771), photo(3394650)],
    status: 'available',
    stock: 6,
    tags: ['bestseller'],
    keywords: ['audio', 'écouteurs', 'airpods', 'bluetooth'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
  {
    slug: 'ensemble-enfant',
    name: 'Ensemble coton enfant',
    category: 'Enfants',
    price: 8500,
    description: 'Un ensemble confortable et facile à vivre pour les petits explorateurs.',
    details: ['Coton doux', 'Lavable en machine', 'Tailles de 2 à 8 ans'],
    images: [photo(1620760), photo(1648377), photo(1620653)],
    status: 'unavailable',
    badge: 'Bientôt de retour',
    stock: 0,
    tags: [],
    keywords: ['enfant', 'coton', 'vêtement', 'bébé'],
    deliveryCities: ['Yaoundé', 'Douala'],
  },
];

const categories = [
  { name: 'Mode', icon: 'Mode' },
  { name: 'Tech & accessoires', icon: 'Tech' },
  { name: 'Maison', icon: 'Maison' },
  { name: 'Beauté', icon: 'Beauté' },
  { name: 'Enfants', icon: 'Enfants' },
];

export async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM products');
  if (Number(rows[0]?.c) > 0) return;

  for (const cat of categories) {
    await pool.query(
      'INSERT INTO categories (name, icon, status) VALUES ($1, $2, $3)',
      [cat.name, cat.icon, 'active']
    );
  }

  for (const p of products) {
    await pool.query(
      `INSERT INTO products (name, slug, category, price, oldPrice, description, details, images, status, featured, badge, stock, tags, keywords, deliveryCities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        p.name,
        p.slug,
        p.category,
        p.price,
        p.oldPrice ?? null,
        p.description,
        JSON.stringify(p.details),
        JSON.stringify(p.images),
        p.status ?? 'available',
        p.featured ? 1 : 0,
        p.badge ?? null,
        p.stock ?? 0,
        JSON.stringify(p.tags ?? []),
        JSON.stringify(p.keywords ?? []),
        JSON.stringify(p.deliveryCities ?? []),
      ]
    );
  }

  console.log('Database seeded.');
}