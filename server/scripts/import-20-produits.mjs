// Import de 20 articles via l'API locale ACHAT+ (meme base que la prod).
// Usage : node scripts/import-20-produits.mjs
// Verifie chaque image (HTTP 200 + type image + taille) avant insertion, puis
// skippe les slugs deja presents.
import 'dotenv/config';
import crypto from 'node:crypto';

const API = process.env.API_URL || 'http://localhost:4000';
const SECRET = process.env.ADMIN_SECRET || '';
const WIDTH = 900;

const photo = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${WIDTH}`;
const CITIES = ['Yaoundé', 'Douala'];

// Prix : "final" = prix affiché en boutique (le serveur applique la marge).
// grossiste = final / 1.2 (marge categorie 20%).
const grossiste = (final) => Math.round(final / 1.2);

const products = [
  // ---------------- Mode ----------------
  {
    name: 'Baskets running homme légères', category: 'Mode', final: 32000, oldPrice: 39000,
    brand: 'Nike', badge: 'Promo', featured: true, stock: 14, ids: [34707770, 267301, 1027130],
    description: 'Baskets de sport légères pour le quotidien, semelle souple et respirante, à porter du matin au soir sans fatigue.',
    details: ['Semelle mousse légère', 'Dessus mesh respirant', 'Pointures 39 à 45', 'Lavable à la main'],
    tags: ['chaussures', 'homme', 'sport', 'baskets'],
    keywords: ['baskets homme', 'chaussures sport', 'running', 'semelle souple'],
  },
  {
    name: 'Ensemble wax deux pièces', category: 'Mode', final: 45000,
    brand: 'Africadam', badge: 'Nouveau', featured: true, stock: 9, ids: [31914904, 20145326, 34735506],
    description: 'Ensemble wax deux pièces (haut + jupe) en tissu polyester premium, coupe fluide et couleurs garantes. Idéal pour fêtes et cérémonies.',
    details: ['Tissu wax premium', 'Coupe fluide', 'Zips invisible', 'Lavage à la main'],
    tags: ['wax', 'femme', 'ensemble', 'africain'],
    keywords: ['ensemble wax', 'robe wax', 'tenue africaine', 'jupe wax'],
  },
  {
    name: 'Jean slim homme délavé', category: 'Mode', final: 28000,
    brand: 'Levis', badge: 'Bestseller', featured: true, stock: 21, ids: [11434950, 39569353, 34707770],
    description: 'Jean slim délavé, denim stretch confortable, cinq poches et coupe nette. Se porte aussi bien au bureau qu’en sortie.',
    details: ['Denim stretch', 'Coupe slim', '5 poches', 'Tailles 38 à 46'],
    tags: ['jean', 'homme', 'denim', 'slim'],
    keywords: ['jean homme', 'jean slim', 'jean delave', 'pantalon denim'],
  },
  {
    name: 'Chemise lin manches longues', category: 'Mode', final: 24000, oldPrice: 28000,
    brand: '', stock: 17, ids: [14428671, 8973466, 7695514],
    description: 'Chemise en mélange lin et coton, manches longues, col italien. Matière respirante, parfaite pour la saison chaude.',
    details: ['Lin / coton', 'Col italien', 'Coupe droite', 'Lavage machine 30°'],
    tags: ['chemise', 'homme', 'lin', 'manches longues'],
    keywords: ['chemise homme', 'chemise lin', 'chemise longueur', 'chemise ete'],
  },

  // ---------------- Beauté ----------------
  {
    name: 'Parfum floral 100 ml', category: 'Beauté', final: 35000,
    brand: 'Scentsation', badge: 'Bestseller', featured: true, stock: 11, ids: [10873814, 15097440, 15007560],
    description: 'Eau de parfum floral 100 ml, notes de bergamote, rose et musc blanc. Tenue jusqu’à 8 heures, unisexe.',
    details: ['100 ml', 'Notes florales', 'Tenue 8 h', 'Unisexe'],
    tags: ['parfum', 'femme', 'homme', 'floral'],
    keywords: ['parfum floral', 'eau de parfum', 'parfum 100ml', 'parfum longue tenue'],
  },
  {
    name: 'Sérum visage hydratant 30 ml', category: 'Beauté', final: 18000, oldPrice: 22000,
    brand: 'CeraVe', badge: 'Promo', stock: 26, ids: [39471340, 3865548, 6925542],
    description: 'Sérum visage à l’acide hyaluronique et céramides, hydrate 72 h et apaise les peaux sensibles. Sans parfum.',
    details: ['Acide hyaluronique', 'Céramides', 'Sans parfum', '30 ml'],
    tags: ['soin visage', 'hydratation', 'serum', 'peau sensible'],
    keywords: ['serum visage', 'creme hydratante', 'soin hydratant', 'acide hyaluronique'],
  },
  {
    name: 'Rouge à lèvres mat longue tenue', category: 'Beauté', final: 7500,
    brand: 'Maybelline', stock: 40, ids: [14716151, 37857740, 38404389],
    description: 'Rouge à lèvres mat confort, fini velours et tenue 8 h sans transfert. Pigments intenses dès le premier passage.',
    details: ['Fini mat', 'Tenue 8 h', 'Pigments intenses', '4 teintes'],
    tags: ['makeup', 'rouge a levres', 'levres', 'mat'],
    keywords: ['rouge a levres', 'mat', 'longue tenue', 'makeup levres'],
  },
  {
    name: 'Perruque lace front naturelle', category: 'Beauté', final: 55000,
    brand: '', badge: 'Nouveau', featured: true, stock: 6, ids: [13714796, 14581433, 2301842],
    description: 'Perruque lace front en cheveux humains, lace transparente invisible et densité naturelle. Prête à porter en 5 minutes.',
    details: ['Cheveux humains', 'Lace 22,5 cm', 'Densité naturelle', 'Lavable'],
    tags: ['perruque', 'cheveux', 'lace front', 'beauty'],
    keywords: ['perruque lace', 'perruque cheveux humains', 'wig lace front', 'perruque naturelle'],
  },

  // ---------------- Maison ----------------
  {
    name: 'Set cuisine 5 pièces inox', category: 'Maison', final: 38000,
    brand: '', badge: 'Bestseller', featured: true, stock: 8, ids: [11986450, 11161453, 7303783],
    description: 'Set de 5 pièces en inox 18/10 : 3 casseroles, 1 sauteuse et 1 poissonière. Compatible tous feux dont induction.',
    details: ['Inox 18/10', '5 pièces', 'Compatible induction', 'Poignées isolantes'],
    tags: ['cuisine', 'inox', 'casserole', 'set'],
    keywords: ['set cuisine', 'casseroles inox', 'cuisinette inox', 'poissoniere'],
  },
  {
    name: 'Casserole avec couvercle 24 cm', category: 'Maison', final: 16500, oldPrice: 19500,
    brand: '', badge: 'Promo', stock: 22, ids: [4768962, 35041643, 38129110],
    description: 'Casserole 24 cm en inox avec couvercle emboîté et poignées robustes. Parfaite pour le riz, les sauces et les portions.',
    details: ['Inox 18/10', 'Diamètre 24 cm', 'Couvercle emboîté', 'Poignées robustes'],
    tags: ['casserole', 'cuisine', 'inox', 'couvercle'],
    keywords: ['casserole inox', 'casserole avec couvercle', 'casserole 24 cm', 'cuisinier'],
  },
  {
    name: 'Rideau occultant blackout 2 pans', category: 'Maison', final: 42000,
    brand: '', stock: 12, ids: [15800636, 5835536, 23110026],
    description: 'Rideau blackout 2 pans qui bloque jusqu’à 99 % de la lumière, tissu épais et anti-repli. Isole aussi du bruit et du froid.',
    details: ['2 pans', 'Blackout 99 %', 'Anti-repli', 'Œillets inclus'],
    tags: ['rideau', 'blackout', 'fenetre', 'maison'],
    keywords: ['rideau occultant', 'rideau blackout', 'rideau chambre', 'rideau 2 pans'],
  },
  {
    name: 'Parure de lit 4 pièces coton', category: 'Maison', final: 48000, oldPrice: 55000,
    brand: '', badge: 'Promo', stock: 10, ids: [13316618, 6903157, 6489093],
    description: 'Parure de lit 4 pièces en coton 100 %, 200 fils, toucher doux et respirant. Lavable en machine sans perte de couleur.',
    details: ['Coton 100 %', '200 fils', '4 pièces', 'Housse 15/15'],
    tags: ['literie', 'parure de lit', 'coton', 'chambre'],
    keywords: ['parure de lit', 'drap 4 pieces', 'couette cotton', 'literie couple'],
  },

  // ---------------- Enfants ----------------
  {
    name: 'Sandales enfant semelles antidérapantes', category: 'Enfants', final: 14000,
    brand: '', featured: true, stock: 19, ids: [39342086, 15538231, 15844908],
    description: 'Sandales enfant à semelle antidérapante, bride velcro réglable et semelle souple. Supportent les cours de récré.',
    details: ['Semelle antidérapante', 'Bride velcro', 'Pointures 28-35', 'Lavage machine'],
    tags: ['enfant', 'sandales', 'chaussures', 'fille'],
    keywords: ['sandales enfant', 'chaussures enfant', 'sandales antidérapantes', 'chaussures fille'],
  },
  {
    name: 'Voiture télécommandée 2,4 GHz', category: 'Enfants', final: 29000,
    brand: '', badge: 'Nouveau', featured: true, stock: 13, ids: [19226414, 14007163, 4491702],
    description: 'Voiture radiocommandée à l’échelle 1/24, portée de 50 m et directions avant/arrière. Idéale comme cadeau d’anniversaire.',
    details: ['Échelle 1/24', 'Portée 50 m', '2 piles AA', 'Éclairage LED'],
    tags: ['jouet', 'enfant', 'voiture', 'telecommande'],
    keywords: ['voiture telecommandee', 'jouet enfant', 'voiture rc', 'cadeau enfant'],
  },
  {
    name: 'Ensemble bébé 3 pièces coton', category: 'Enfants', final: 19500, oldPrice: 23000,
    brand: '', badge: 'Promo', stock: 24, ids: [12488413, 29015875, 18472915],
    description: 'Ensemble bébé 3 pièces (body, pyjama et bavette) en coton bio doux. Convient dès la naissance, coutures plates.',
    details: ['Coton bio', '3 pièces', 'Corps 0-12 mois', 'Coutures plates'],
    tags: ['bebe', 'enfant', 'ensemble', 'coton'],
    keywords: ['ensemble bebe', 'body bebe', 'pyjama bebe', 'vêtement bébé'],
  },
  {
    name: 'Poussette 3 places pliable', category: 'Enfants', final: 85000,
    brand: 'Baby Trend', stock: 5, ids: [34161734, 14832518, 20868854],
    description: 'Poussette 3 places pliable d’une seule main, dossier réversible et filet de siège. Compatible siège-auto (3 points) selon version.',
    details: ['3 places', 'Pliage une main', 'Dossier réversible', 'Filet de siège'],
    tags: ['poussette', 'bebe', 'enfant', '3 places'],
    keywords: ['poussette 3 places', 'poussette pliable', 'double poussette', 'poussette bébé'],
  },

  // ---------------- Tech & accessoires ----------------
  {
    name: 'Smartphone 128 Go double SIM', category: 'Tech & accessoires', final: 145000, oldPrice: 165000,
    brand: 'Samsung', badge: 'Promo', featured: true, stock: 7, ids: [47261, 14486283, 6901037],
    description: 'Smartphone 128 Go, écran 6,5", double SIM, batterie 5000 mAh et charge rapide 25 W. Garantie 12 mois.',
    details: ['128 Go', 'Écran 6,5 pouces', 'Double SIM', '5000 mAh'],
    tags: ['smartphone', 'telephone', 'double sim', 'android'],
    keywords: ['smartphone 128 go', 'telephone double sim', 'android', 'samsung'],
  },
  {
    name: 'Écouteurs sans fil ANC', category: 'Tech & accessoires', final: 27000,
    brand: 'JBL', badge: 'Bestseller', featured: true, stock: 18, ids: [4195331, 10885667, 11599421],
    description: 'Écouteurs intra sans fil avec réduction de bruit active ANC, 30 h d’autonomie et charge rapide 10 min = 4 h de lecture.',
    details: ['ANC actif', '30 h autonomie', 'Bluetooth 5.3', 'Étui de charge'],
    tags: ['ecouteurs', 'audio', 'bluetooth', 'sport'],
    keywords: ['ecouteurs sans fil', 'ecouteurs bluetooth', 'ecouteurs sport', 'casque bluetooth'],
  },
  {
    name: 'Montre connectée GPS santé', category: 'Tech & accessoires', final: 39000, oldPrice: 45000,
    brand: '', badge: 'Promo', stock: 15, ids: [32483294, 5081914, 31406895],
    description: 'Montre connectée avec GPS, suivi du sommeil, fréquence cardiaque et 12 modes sportifs. Autonomie 10 jours, étanche 5 ATM.',
    details: ['GPS intégré', '12 modes sportifs', '10 jours autonomie', 'Étanche 5 ATM'],
    tags: ['montre connectee', 'sport', 'sante', 'gps'],
    keywords: ['montre connectee', 'bracelet connecte', 'montre gps', 'montre sport'],
  },
  {
    name: 'Batterie externe 20 000 mAh', category: 'Tech & accessoires', final: 22000,
    brand: 'Romoss', stock: 31, ids: [37489595, 38040020, 6296911],
    description: 'Batterie externe 20 000 mAh avec double sortie USB et charge rapide 22,5 W. Recharge un téléphone jusqu’à 4 fois.',
    details: ['20 000 mAh', 'Double sortie USB', 'Charge rapide 22,5 W', 'Écran LED'],
    tags: ['batterie externe', 'powerbank', 'chargeur', 'voyage'],
    keywords: ['batterie externe', 'power bank 20000', 'chargeur rapide', 'batterie portable'],
  },
];

// ---------------------------------------------------------------------------

const token = () => {
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: Date.now() + 3600_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};

const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

async function checkImage(url) {
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  const type = res.headers.get('content-type') || '';
  const buf = await res.arrayBuffer();
  return { ok: res.status === 200 && type.startsWith('image/') && buf.byteLength > 5000, status: res.status, type, bytes: buf.byteLength };
}

async function main() {
  if (!SECRET) throw new Error('ADMIN_SECRET absent du .env');

  const existing = new Set();
  const list = await (await fetch(`${API}/api/products/all`)).json();
  const items = Array.isArray(list) ? list : (list.items || []);
  for (const p of items) if (p.slug) existing.add(p.slug);

  const slugify = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let created = 0;
  let skipped = 0;
  const failures = [];

  for (const item of products) {
    const slug = slugify(item.name);
    if (existing.has(slug)) {
      console.log(`SKIP  ${item.name} (déjà présent)`);
      skipped += 1;
      continue;
    }

    const urls = item.ids.map(photo);
    const checks = await Promise.all(urls.map(async (url) => {
      try { return await checkImage(url); } catch (e) { return { ok: false, status: 'ERR', type: e.message, bytes: 0 }; }
    }));
    const bad = checks.filter((c) => !c.ok);

    const payload = {
      name: item.name,
      category: item.category,
      price: grossiste(item.final),
      supplierPrice: grossiste(item.final),
      marginPercent: 20,
      linked: item.oldPrice ?? null,
      description: item.description,
      details: item.details,
      images: urls,
      status: 'available',
      featured: Boolean(item.featured),
      badge: item.badge ?? null,
      stock: item.stock,
      tags: item.tags,
      keywords: item.keywords,
      deliveryCities: CITIES,
      brand: item.brand,
      deliveryInfo: 'Livraison 24 h à Douala et Yaoundé',
      warrantyInfo: item.brand ? `Garantie 12 mois ${item.brand}` : 'Garantie 3 mois',
    };

    const res = await fetch(`${API}/api/products`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    const body = await res.json();
    if (!res.ok) {
      failures.push(`${item.name}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
      console.log(`FAIL  ${item.name}: ${res.status}`);
      continue;
    }
    created += 1;
    const imgInfo = bad.length === 0
      ? `3 images OK (${(checks[0].bytes / 1024).toFixed(0)} Ko)`
      : `${3 - bad.length}/3 images OK | KO: ${bad.map((b) => `${b.status}/${b.type}`).join(', ')}`;
    console.log(`OK    ${body.name.padEnd(44)} id=${String(body.id).padEnd(3)} final=${String(body.finalPrice).padEnd(7)} stock=${String(body.stock).padEnd(3)} ${imgInfo}`);
  }

  console.log(`\nRécapitulatif : ${created} créés, ${skipped} ignorés, ${failures.length} échecs`);
  for (const f of failures) console.log(`  ! ${f}`);
}

main().catch((err) => { console.error('Erreur :', err.message); process.exit(1); });