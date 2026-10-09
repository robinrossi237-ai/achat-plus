// Creation de 5 categories + 40 articles via l'API locale ACHAT+ (base de prod).
// Usage : node scripts/import-catalog-2.mjs
// Verifie chaque image (HTTP 200 + type image + taille) avant insertion.
import 'dotenv/config';
import crypto from 'node:crypto';
import dns from 'node:dns';

dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4', ...dns.getServers()]);

const API = process.env.API_URL || 'http://localhost:4000';
const SECRET = process.env.ADMIN_SECRET || '';
const WIDTH = 900;

const photo = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${WIDTH}`;
const CITIES = ['Yaoundé', 'Douala'];
const grossiste = (final) => Math.round(final / 1.2);

// ---------------------------------------------------------------------------
// Nouvelles categories : 2 bannieres chacune (rotation 5 s cote front)
// ---------------------------------------------------------------------------
const categories = [
  { name: 'Sport & Bien-être', slug: 'sport-bien-etre', icon: '🏃', description: 'Matériel de sport, fitness et bien-être pour bouger chez soi ou en salle.', banners: ['7743320', '30468566'] },
  { name: 'Électroménager', slug: 'electromenager', icon: '🔌', description: 'Appareils électroménagers pour la maison : froid, lavage, cuisine et confort.', banners: ['18651508', '4686822'] },
  { name: 'Chaussures', slug: 'chaussures', icon: '👟', description: 'Chaussures homme, femme et enfant : baskets, escarpins, sandales et bottines.', banners: ['28639010', '1027130'] },
  { name: 'Accessoires & Bagagerie', slug: 'accessoires-bagagerie', icon: '👜', description: 'Sacs, portefeuilles, ceintures, lunettes et accessoires du quotidien.', banners: ['11648353', '845857'] },
  { name: 'Papeterie & Bureau', slug: 'papeterie-bureau', icon: '📒', description: 'Fournitures de bureau, papeterie et mobilier pour le travail et les études.', banners: ['12911551', '39607047'] },
];

// ---------------------------------------------------------------------------
// 40 articles : 8 par nouvelle categorie
// ---------------------------------------------------------------------------
const products = [
  // -------- Sport & Bien-être --------
  { name: 'Tapis de yoga antidérapant 6 mm', category: 'Sport & Bien-être', final: 18500, badge: 'Nouveau', featured: true, stock: 22, theme: 'tapis', ids: [6246682, 25596885, 20143823], description: 'Tapis de yoga 6 mm en TPE ecology, surface antidérapante sur les deux faces eteni resistantes à la sueur. Livré avec sa sangle de transport.', details: ['Épaisseur 6 mm', 'TPE ecology', 'Antidérapant double face', 'Sangle incluse'], tags: ['yoga', 'tapis', 'sport', 'fitness'], keywords: ['tapis de yoga', 'tapis sport', 'tapis antidérapant', 'accessoire yoga'] },
  { name: 'Vélo d’appartement pliable', category: 'Sport & Bien-être', final: 145000, oldPrice: 165000, badge: 'Promo', featured: true, stock: 4, theme: 'velo', ids: [5807629, 32884236, 19342383], description: 'Vélo d’appartement pliable avec résistance magnétique réglable sur 8 niveaux, roue Silent et siège confort. Se range debout contre un mur.', details: ['Résistance magnétique 8 niveaux', 'Roue Silent', 'Siège réglable', 'Pliable et transportable'], tags: ['velo', 'sport', 'fitness', 'maison'], keywords: ['velo dappartement', 'bike', 'velo sport', 'cycliste maison'] },
  { name: 'Haltères réglables 2 × 10 kg', category: 'Sport & Bien-être', final: 65000, stock: 9, theme: 'haltere', ids: [4720773, 13451630, 7743320], description: 'Pair d’haltères réglables de 2 à 10 kg avec système de verrouillage rapide. Revêtement antidérapant et poignées ergonomiques.', details: ['Charge réglable 2 à 10 kg', 'Verrouillage rapide', 'Revêtement antidérapant', '2 haltères + 2 disques'], tags: ['halteres', 'musculation', 'sport', 'fitness'], keywords: ['halteres reglables', 'poids sport', 'set haltères', 'musculation maison'] },
  { name: 'Corde à sauter vitesse pro', category: 'Sport & Bien-être', final: 7500, stock: 34, theme: 'corde', ids: [4804339, 5275778, 5278806], description: 'Corde à sauter professionnelle avec câbles acier gainés et poignées à roulement. Réglable en longueur pour adultes et enfants.', details: ['Câble acier gainé', 'Roulement rapide', 'Longueur réglable', 'Poids 240 g'], tags: ['corde', 'sport', 'fitness', 'cardio'], keywords: ['corde a sauter', 'corde sport', 'skipping', 'cardio maison'] },
  { name: 'Gourde sport isotherme 750 ml', category: 'Sport & Bien-être', final: 12500, badge: 'Bestseller', stock: 27, theme: 'gourde', ids: [7690201, 3737800, 3195774], description: 'Gourde isotherme double paroi inox 750 ml, garde les boissons froides 24 h et chaudes 12 h. Couvercle sport avec paille vissable.', details: ['Double paroi inox', 'Froid 24 h / chaud 12 h', 'Couvercle sport', '750 ml'], tags: ['gourde', 'sport', 'isotherme', 'eau'], keywords: ['gourde sport', 'gourde isotherme', 'bouteille eau sport', 'thermos sport'] },
  { name: 'Casque vélo adjustable MIPS', category: 'Sport & Bien-être', final: 28000, oldPrice: 33000, badge: 'Promo', stock: 12, theme: 'casque', ids: [12956080, 5803274, 5807860], description: 'Casque de vélo avec réservation de protection occipital, ventilation 18 entrées et boucle de réglage à une main. Tailles M et L.', details: ['18 entrées de ventilation', 'Réglage une main', 'Tailles M / L', 'Poids 280 g'], tags: ['casque', 'velo', 'sport', 'securite'], keywords: ['casque velo', 'casque cycliste', 'casque sport', 'casque mips'] },
  { name: 'Ballon de foot taille 5', category: 'Sport & Bien-être', final: 9500, stock: 30, theme: 'ballon', ids: [15074245, 27915834, 35142168], description: 'Ballon de foot taille 5 officiel, cousu main et couche PU subsurface. Pression 0,4 bar, valve à double évent.', details: ['Taille 5', 'Cousu main', 'Couche PU subsurface', 'Pression 0,4 bar'], tags: ['ballon', 'foot', 'sport', 'enfant'], keywords: ['ballon de foot', 'ballon taille 5', 'ballon sport', 'ballon foot'] },
  { name: 'Brassière sport seamless', category: 'Sport & Bien-être', final: 11000, stock: 25, theme: 'brassiere', ids: [8483369, 6879815, 29242370], description: 'Brassière de sport sans couture, tissu respirant qui évacue la transpiration et bandes élastiquées qui ne compriment pas. Tailles S à XL.', details: ['Sans couture', 'Tissu respirant', 'Bandeaux non compressants', 'Tailles S à XL'], tags: ['brassiere', 'sport', 'fitness', 'femme'], keywords: ['brassiere sport', 'brassiere sport femme', 'sous vetement sport', 'top sport seamless'] },

  // -------- Électroménager --------
  { name: 'Réfrigérateur 250 L no frost', category: 'Électroménager', final: 285000, badge: 'Bestseller', featured: true, stock: 3, theme: 'frigo', ids: [18651508, 8289912, 11899611], description: 'Réfrigérateur 250 L no frost, 3 étagères verre, 2 tiroirs fruits et légumes et congelateur intégré. Consommation classe A.', details: ['Capacité 250 L', 'No frost', 'Classe énergétique A', 'Garantie 24 mois'], tags: ['refrigerateur', 'electromenager', 'cuisine', 'froid'], keywords: ['refrigerateur', 'frigo 250l', 'refrigerateur no frost', 'electromenager cuisine'] },
  { name: 'Micro-ondes 20 L', category: 'Électroménager', final: 42000, stock: 8, theme: 'micro', ids: [4686822, 8142867, 6588598], description: 'Micro-ondes 20 L avec 10 niveaux de puissance, décongélation rapide, minuteur et programmes de cuisson. Plateau tournant 25,5 cm.', details: ['20 L', '10 niveaux de puissance', 'Décongélation rapide', 'Plateau 25,5 cm'], tags: ['micro-ondes', 'electromenager', 'cuisine', 'cuisson'], keywords: ['micro ondes', 'micro onde 20l', 'micro-ondes cuisine', 'four micro ondes'] },
  { name: 'Lave-linge 7 kg 1200 tr/min', category: 'Électroménager', final: 195000, oldPrice: 225000, badge: 'Promo', stock: 5, theme: 'linge', ids: [4700400, 9669475, 8774448], description: 'Lave-linge 7 kg, 1200 tours/min, 14 programmes dont rapide 15 min et coton, et moteur à variateur silencieux. Classe A.', details: ['7 kg', '1200 tours/min', '14 programmes', 'Classe A'], tags: ['lave-linge', 'electromenager', 'linge', 'maison'], keywords: ['lave linge', 'machine a laver', 'lave-linge 7kg', 'electromenager maison'] },
  { name: 'Climatiseur split 12 000 BTU', category: 'Électroménager', final: 245000, stock: 4, theme: 'clima', ids: [17333482, 18725613, 13948383], description: 'Climatiseur split inversible 12 000 BTU, froid et chaleur, mode turbo et déshumidification. Monobloc avec télécommande et garantie 3 ans.', details: ['12 000 BTU', 'Froid et chaleur', 'Mode turbo', 'Garantie 3 ans'], tags: ['climatiseur', 'electromenager', 'froid', 'confort'], keywords: ['climatiseur', 'climatiseur split', 'climatiseur 12000btu', 'clim'] },
  { name: 'Aspirateur sans sac 2 L', category: 'Électroménager', final: 38000, stock: 14, theme: 'aspi', ids: [4876669, 37554739, 6195274], description: 'Aspirateur sans sac 2 L avec puissance 1800 Pa, brosse motorisée et 3 accessoires. Longueur de câble 6 m et rangoir intégré.', details: ['Puissance 1800 Pa', 'Réservoir 2 L', 'Brosse motorisée', 'Câble 6 m'], tags: ['aspirateur', 'electromenager', 'nettoyage', 'maison'], keywords: ['aspirateur', 'aspirateur sans sac', 'aspirateur 1800pa', 'aspirateur maison'] },
  { name: 'Fer à vapeur 1800 W', category: 'Électroménager', final: 22000, badge: 'Promo', stock: 19, theme: 'fer', ids: [2797454, 27390906, 15212040], description: 'Fer à vapeur 1800 W avec réservoir 180 ml, vapeur continue 30 g/min etSemelle inox antiadhésive.Semelle pivotante pour passer les cols.', details: ['Puissance 1800 W', 'Vapeur 30 g/min', 'Réservoir 180 ml', 'Semelle inox'], tags: ['fer a repasser', 'electromenager', 'linge', 'entretien'], keywords: ['fer a vapeur', 'fer a repasser', 'fer vapeur maison', 'fer a repasser electrique'] },
  { name: 'Blender plongeant 800 W', category: 'Électroménager', final: 16500, stock: 20, theme: 'blender', ids: [7936983, 16096610, 12119029], description: 'Blendeur plongeant 800 W, 2 vitesses, lame inox 4 tranches et bol gradué 600 ml. Idéal pour sauces, soupes et smoothies.', details: ['Puissance 800 W', '2 vitesses', 'Lame inox', 'Bol 600 ml'], tags: ['blender', 'electromenager', 'cuisine', 'mixeur'], keywords: ['blender plongeant', 'mixeur plongeant', 'blender cuisine', 'blender 800w'] },
  { name: 'Air fryer 4,5 L', category: 'Électroménager', final: 48000, badge: 'Nouveau', featured: true, stock: 11, theme: 'airfryer', ids: [35285814, 39851023, 5903389], description: 'Air fryer 4,5 L avec 8 programmes de cuisson, panier antiadhésif et écran digital. Cuisson sans huile ni graisse, moins de 80 % d’odeur.', details: ['Capacité 4,5 L', '8 programmes', 'Écran digital', 'Panier antiadhésif'], tags: ['air fryer', 'electromenager', 'cuisine', 'friture'], keywords: ['air fryer', 'friteuse sans huile', 'air fryer 4.5l', 'appareil cuisine'] },

  // -------- Chaussures --------
  { name: 'Escarpins femme cuir', category: 'Chaussures', final: 39000, badge: 'Nouveau', stock: 11, theme: 'escarpins', ids: [28639010, 27035619, 26850888], description: 'Escarpins femme en cuir lisse, talon 7 cm et semelle antidérapante. Doublure douce qui évite les frottements.', details: ['Cuir lisse', 'Talon 7 cm', 'Semelle antidérapante', 'Doublure douce'], tags: ['escarpins', 'chaussures', 'femme', 'elegant'], keywords: ['escarpins femme', 'chaussures femme', 'escarpins cuir', 'chaussures elegantes'] },
  { name: 'Sandales femme tressées', category: 'Chaussures', final: 18500, stock: 17, theme: 'sandales', ids: [27174537, 23692992, 7202800], description: 'Sandales femme à brides tressées, doublure molle et semelle compensée 4 cm. Parfaites pour la plage et les soirées.', details: ['Brides tressées', 'Semelle compensée 4 cm', 'Doublure molle', 'Fermoir réglable'], tags: ['sandales', 'chaussures', 'femme', 'ete'], keywords: ['sandales femme', 'sandales tressees', 'chaussures femme', 'sandales ete'] },
  { name: 'Chaussures de bureau femme', category: 'Chaussures', final: 23000, stock: 13, theme: 'bureau', ids: [10297112, 12911551, 5264901], description: 'Chaussures de bureau femme à bout carré, talon 3 cm et dessus respirant. Confort toute la journée au travail.', details: ['Bout carré', 'Talons 3 cm', 'Dessin respirant', 'Confort 10 h'], tags: ['chaussures bureau', 'chaussures', 'femme', 'travail'], keywords: ['chaussures de bureau', 'escarpins bureau', 'chaussures femme', 'chaussures travail'] },
  { name: 'Bottines femme cuir hiver', category: 'Chaussures', final: 52000, oldPrice: 59000, badge: 'Promo', stock: 7, theme: 'bottines', ids: [34667456, 15358887, 34667460], description: 'Bottines femme en cuir avec fourrure synthétique, semelle crantée et zip latéral. Talon 6 cm, elles gardent le pied au chaud.', details: ['Cuir et fourrure', 'Semelle crantée', 'Zip latéral', 'Talon 6 cm'], tags: ['bottines', 'chaussures', 'femme', 'hiver'], keywords: ['bottines femme', 'bottines hiver', 'chaussures hiver', 'bottines cuir'] },
  { name: 'Baskets street homme', category: 'Chaussures', final: 32000, badge: 'Bestseller', featured: true, stock: 18, theme: 'baskets', ids: [8117154, 30063866, 29548615], description: 'Baskets street homme, tige en toile et daim, semelle vulcanisée et lacets plats. Robustes pour la rue comme pour le sport.', details: ['Toile et daim', 'Semelle vulcanisée', 'Lacets plats', 'Semelle intérieure rembourrée'], tags: ['baskets', 'chaussures', 'homme', 'street'], keywords: ['baskets homme', 'baskets street', 'chaussures homme', 'baskets city'] },
  { name: 'Espadrilles homme tressées', category: 'Chaussures', final: 17500, stock: 15, theme: 'espadrilles', ids: [38570360, 5560288, 30335806], description: 'Espadrilles homme en jute tressé et toile de coton, semelle vulcanisée et doublure qui laisse respirer le pied. Légères et faciles à porter.', details: ['Jute et coton', 'Semelle vulcanisée', 'Légères', 'Lavable'], tags: ['espadrilles', 'chaussures', 'homme', 'ete'], keywords: ['espadrilles homme', 'espadrilles', 'chaussures homme', 'chaussures ete'] },
  { name: 'Sneakers cuir homme', category: 'Chaussures', final: 42000, stock: 9, theme: 'sneakers', ids: [267301, 18688090, 20678075], description: 'Sneakers en cuir pleine fleur, semelle blanche vulcanisée et languette matelassée. Assorties à un jean comme à un costume.', details: ['Cuir pleine fleur', 'Semelle vulcanisée', 'Languette matelassée', 'Doublure cuir'], tags: ['sneakers', 'chaussures', 'homme', 'cuir'], keywords: ['sneakers homme', 'sneakers cuir', 'chaussures homme', 'baskets cuir'] },
  { name: 'Baskets enfant', category: 'Chaussures', final: 14500, badge: 'Promo', stock: 22, theme: 'baskets-enfant', ids: [15538231, 15844908, 12235410], description: 'Baskets enfant avec bride velcro, semelle souple et bout renforcé. Pointures 28 à 35, elles tiennent les jeux de dehors.', details: ['Bride velcro', 'Semelle souple', 'Bout renforcé', 'Pointures 28-35'], tags: ['baskets', 'chaussures', 'enfant', 'sport'], keywords: ['baskets enfant', 'chaussures enfant', 'chaussures enfant sport', 'baskets fille'] },

  // -------- Accessoires & Bagagerie --------
  { name: 'Sac à main cuir premium', category: 'Accessoires & Bagagerie', final: 38000, badge: 'Nouveau', featured: true, stock: 10, theme: 'sac-main', ids: [11648353, 19061019, 33656776], description: 'Sac à main en cuir véritable, doublure en tissu et poche zippée intérieure. Format A5, bandoulière amovible.', details: ['Cuir véritable', 'Format A5', 'Bandoulière amovible', 'Pochette zippée'], tags: ['sac a main', 'bagagerie', 'cuir', 'femme'], keywords: ['sac a main femme', 'sac cuir', 'sac a main', 'sac epaule'] },
  { name: 'Sac à dos 20 L', category: 'Accessoires & Bagagerie', final: 19500, stock: 16, theme: 'sac-dos', ids: [4901995, 4907460, 4907597], description: 'Sac à dos 20 L avec compartiment matelassé pour ordinateur 15,6 pouces, poche frontale zippée et bandes latérales.', details: ['20 L', 'Compartiment 15,6 pouces', 'Poche frontale zippée', 'Dos matelassé'], tags: ['sac a dos', 'bagagerie', 'voyage', 'sac'], keywords: ['sac a dos', 'sac dos 20l', 'sac a dos ordinateur', 'sac voyage'] },
  { name: 'Portefeuille cuir RFID', category: 'Accessoires & Bagagerie', final: 14000, badge: 'Bestseller', stock: 24, theme: 'portefeuille', ids: [28086457, 7952556, 36933384], description: 'Portefeuille cuir avec protection RFID, 8 emplacements cartes et 2 compartiments billets. Format compact pour poche arrière.', details: ['Protection RFID', '8 emplacements cartes', '2 compartiments billets', 'Format compact'], tags: ['portefeuille', 'cuir', 'accessoires', 'rfid'], keywords: ['portefeuille cuir', 'portefeuille rfid', 'portefeuille homme', 'porte carteira'] },
  { name: 'Ceinture cuir homme', category: 'Accessoires & Bagagerie', final: 12000, stock: 28, theme: 'ceinture', ids: [6138485, 34150926, 34150930], description: 'Ceinture en cuir pleine fleur, boucle métal mat et interchangeable. Tailles 85 à 115 cm avec 5 passants.', details: ['Cuir pleine fleur', 'Boucle métal mat', 'Taille réglable', '5 passants'], tags: ['ceinture', 'cuir', 'homme', 'accessoires'], keywords: ['ceinture homme', 'ceinture cuir', 'ceinture homme cuir', 'ceinture adjustable'] },
  { name: 'Lunettes de soleil polarisées', category: 'Accessoires & Bagagerie', final: 16500, badge: 'Promo', stock: 20, theme: 'lunettes', ids: [20106424, 26575042, 3042732], description: 'Lunettes de soleil polarisées UV400, monture légère et lentilles traitées anti-reflet. Étui et chiffon inclus.', details: ['Polarisées UV400', 'Anti-reflet', 'Monture légère', 'Étui inclus'], tags: ['lunettes', 'soleil', 'accessoires', 'lunettes de soleil'], keywords: ['lunettes de soleil', 'lunettes polarisees', 'lunettes soleil homme', 'lunettes uv400'] },
  { name: 'Casquette brodée', category: 'Accessoires & Bagagerie', final: 6500, stock: 35, theme: 'casquette', ids: [7893079, 19272485, 26791665], description: 'Casquette brodée 100 % coton, visière préformée et fermeture arrière réglable. Elle tient bien la forme après lavage.', details: ['100 % coton', 'Broderie ton sur ton', 'Fermeture réglable', 'Six pans'], tags: ['casquette', 'accessoires', 'coton', 'unisexe'], keywords: ['casquette brodee', 'casquette', 'casquette homme', 'casquette coton'] },
  { name: 'Sac de voyage 60 L', category: 'Accessoires & Bagagerie', final: 42000, stock: 7, theme: 'sac-voyage', ids: [39434843, 6633602, 33964496], description: 'Sac de voyage 60 L en polyester renforcé, roue et poignée télescopique, zip extensible et poche frontale. Format cabine ou soute.', details: ['60 L extensible', 'Roues et poignée télescopique', 'Zip extensible', 'Poche frontale'], tags: ['sac de voyage', 'bagagerie', 'valise', 'voyage'], keywords: ['sac de voyage', 'sac voyage 60l', 'valise cabine', 'bagage'] },
  { name: 'Bracelet jonc métal doré', category: 'Accessoires & Bagagerie', final: 8500, stock: 26, theme: 'bracelet', ids: [3756353, 13278394, 10432692], description: 'Bracelet jonc en métal doré à l’or fin, fermoir réglable et finition polie. Résiste à l’eau, à porter seul ou en accumulation.', details: ['Métal doré à l’or fin', 'Fermoir réglable', 'Résiste à l’eau', 'Longueur 17 cm'], tags: ['bracelet', 'bijou', 'femme', 'accessoires'], keywords: ['bracelet jonc', 'bracelet femme', 'bracelet dor', 'jonc main'] },

  // -------- Papeterie & Bureau --------
  { name: 'Carnet A5 192 pages', category: 'Papeterie & Bureau', final: 5500, stock: 40, theme: 'carnet', ids: [273034, 627530, 1083728], description: 'Carnet A5 papier 80 g, 192 pages quadrillées et couverture rigide. Porte-plume et 4 signets repositionnables.', details: ['Format A5', 'Papier 80 g', '192 pages quadrillées', 'Couverture rigide'], tags: ['carnet', 'papeterie', 'bureau', 'ecriture'], keywords: ['carnet a5', 'carnet', 'papeterie bureau', 'carnet quadrille'] },
  { name: 'Stylo bille', category: 'Papeterie & Bureau', final: 1500, stock: 80, theme: 'stylo', ids: [7841506, 197293, 13970341], description: 'Stylo bille ergonomique, bille 1,0 mm, encre bleue rapide qui sèche sans bavures. Corps en aluminium mat.', details: ['Bille 1,0 mm', 'Encre bleu roi', 'Sèche rapidement', 'Corps aluminium mat'], tags: ['stylo', 'papeterie', 'bureau', 'ecriture'], keywords: ['stylo bille', 'stylo bleu', 'papeterie', 'stylo ecriture'] },
  { name: 'Ramette 500 feuilles A4', category: 'Papeterie & Bureau', final: 9500, badge: 'Promo', stock: 30, theme: 'rame', ids: [28452286, 6991807, 34369598], description: 'Ramette 500 feuilles A4 80 g, papier blanc extra et opacité élevée. Compatible imprimante laser et jet d’encre.', details: ['500 feuilles', 'Format A4', '80 g/m²', 'Compatible laser'], tags: ['ramette', 'papier', 'papeterie', 'impression'], keywords: ['ramette a4', 'papier a4', 'ramette 500 feuilles', 'papier imprimante'] },
  { name: 'Classeur A4 8 cm', category: 'Papeterie & Bureau', final: 7800, stock: 18, theme: 'classeur', ids: [12911551, 4792286, 34293528], description: 'Classeur A4 8 cm avec anneaux 30 mm, mechanismed anneaux à levier et étiquette porte-étiquette. Solide pour classer les dossiers.', details: ['Format A4', 'Dos 8 cm', 'Anneaux 30 mm', 'Levier métallique'], tags: ['classeur', 'bureau', 'papeterie', 'dossiers'], keywords: ['classeur a4', 'classeur documents', 'classeur bureau', 'chemise dossier'] },
  { name: 'Calculatrice scientifique 12 chiffres', category: 'Papeterie & Bureau', final: 6000, stock: 22, theme: 'calculatrice', ids: [5921494, 5563404, 4065748], description: 'Calculatrice scientifique 12 chiffres, 240 fonctions et mémoire 2 lignes. Alimentation solaire + pile, écran incliné.', details: ['12 chiffres', '240 fonctions', 'Mémoire 2 lignes', 'Solaire + pile'], tags: ['calculatrice', 'bureau', 'papeterie', 'scientifique'], keywords: ['calculatrice scientifique', 'calculatrice', 'calculatrice 12 chiffres', 'calculatrice bureau'] },
  { name: 'Enveloppes kraft 100 pièces', category: 'Papeterie & Bureau', final: 4500, stock: 34, theme: 'enveloppe', ids: [10011979, 4968675, 1550334], description: 'Enveloppes kraft DL 110 × 220 mm, 100 g/m² et fermeture à coller. Teinte naturelle qui met les logos en valeur.', details: ['Format DL 110 x 220 mm', '100 g/m²', '100 enveloppes', 'Fermeture à coller'], tags: ['enveloppes', 'papeterie', 'bureau', 'courrier'], keywords: ['enveloppes kraft', 'enveloppe dl', 'enveloppes courrier', 'enveloppes a4'] },
  { name: 'Tableau blanc 120 × 90 cm', category: 'Papeterie & Bureau', final: 32000, stock: 6, theme: 'tableau', ids: [6373675, 17714157, 5793461], description: 'Tableau blanc 120 × 90 cm, surface laquée effaçable et cadre aluminium. Livré avec 4 marqueurs et une éponge.', details: ['Format 120 x 90 cm', 'Surface laquée', 'Cadre aluminium', '4 marqueurs + éponge'], tags: ['tableau blanc', 'bureau', 'ecole', 'mural'], keywords: ['tableau blanc', 'tableau blanc 120x90', 'tableau ecole', 'tableau presentation'] },
  { name: 'Chaise de bureau ergonomique', category: 'Papeterie & Bureau', final: 58000, oldPrice: 67000, badge: 'Promo', stock: 8, theme: 'chaise', ids: [295480, 13813929, 7101236], description: 'Chaise de bureau ergonomique avec dossier maillé, accoudoirs réglables et hauteur d’assise réglable. Support jusqu’à 120 kg.', details: ['Dossier maillé', 'Accoudoirs réglables', 'Hauteur réglable', 'Support 120 kg'], tags: ['chaise de bureau', 'bureau', 'mobilier', 'ergonomie'], keywords: ['chaise de bureau', 'chaise ergonomique', 'fauteuil bureau', 'chaise travail'] },
];

// ---------------------------------------------------------------------------

const token = () => {
  const payload = Buffer.from(JSON.stringify({ sub: 'admin', exp: Date.now() + 3600_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Le DNS du reseau tombe par moments : on retente chaque appel.
async function resilient(fn, attempts = 5, label = '') {
  let lastErr;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err);
      const hard = !/fetch failed|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|timeout|socket hang up|terminated/i.test(msg);
      if (hard || i === attempts) throw err;
      console.warn(`  retry ${i}/${attempts - 1} ${label}: ${msg.slice(0, 80)}`);
      await sleep(1200 * i);
    }
  }
  throw lastErr;
}

const apiFetch = (path, options = {}) => resilient(() => fetch(`${API}${path}`, options), 5, path);

async function checkImage(url) {
  const res = await resilient(() => fetch(url, { redirect: 'follow' }), 4, 'image');
  const type = res.headers.get('content-type') || '';
  const buf = await res.arrayBuffer();
  return { ok: res.status === 200 && type.startsWith('image/') && buf.byteLength > 5000, status: res.status, type, bytes: buf.byteLength };
}

async function checkAll(urls) {
  const results = await Promise.all(urls.map(async (u) => {
    try { return await checkImage(u); } catch (e) { return { ok: false, status: 'ERR', type: e.message, bytes: 0 }; }
  }));
  return { results, okCount: results.filter((r) => r.ok).length };
}

const slugify = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function main() {
  if (!SECRET) throw new Error('ADMIN_SECRET absent du .env');

  // --- categories ---
  const existingCatsRaw = await apiFetch('/api/categories');
  const existingCats = (await existingCatsRaw.json()).map((c) => c.name);
  let catsCreated = 0;
  let catsUpdated = 0;
  for (const cat of categories) {
    const banners = cat.banners.map(photo);
    if (existingCats.includes(cat.name)) {
      const row = (await (await apiFetch('/api/categories')).json()).find((c) => c.name === cat.name);
      const have = (row?.images?.length || 0) + (row?.imageUrl ? 1 : 0);
      if (have >= banners.length) { console.log(`SKIP  categorie ${cat.name} (${have} bannieres)`); continue; }
      const res = await apiFetch('/api/categories', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, images: banners, marginPercent: 20, status: 'active' }),
      });
      // La categorie existe : on met a jour les bannieres via PUT
      const put = await apiFetch(`/api/categories/${row.id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ images: banners, imageUrl: banners[0] }),
      });
      if (put.ok) { catsUpdated += 1; console.log(`OK    categorie ${cat.name.padEnd(26)} bannieres completees`); }
      else console.log(`FAIL  maj categorie ${cat.name}: ${put.status}`);
      continue;
    }
    const { okCount } = await checkAll(banners);
    const res = await apiFetch('/api/categories', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({
        name: cat.name, slug: cat.slug, icon: cat.icon,
        description: cat.description, images: banners, marginPercent: 20, status: 'active',
      }),
    });
    const body = await res.json();
    if (!res.ok) { console.log(`FAIL  categorie ${cat.name}: ${res.status} ${JSON.stringify(body).slice(0, 160)}`); continue; }
    catsCreated += 1;
    console.log(`OK    categorie ${cat.name.padEnd(26)} id=${String(body.id).padEnd(3)} bannieres ${okCount}/${banners.length}`);
  }

  // --- produits ---
  const list = await (await apiFetch('/api/products/all')).json();
  const existing = new Set((Array.isArray(list) ? list : (list.items || [])).map((p) => p.slug).filter(Boolean));

  let created = 0;
  let skipped = 0;
  const failures = [];

  for (const item of products) {
    const slug = slugify(item.name);
    if (existing.has(slug)) { console.log(`SKIP  ${item.name}`); skipped += 1; continue; }
    const urls = item.ids.map(photo);
    const { okCount } = await checkAll(urls);
    if (okCount < urls.length) {
      failures.push(`${item.name}: ${okCount}/${urls.length} images valides`);
    }
    const res = await apiFetch('/api/products', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({
        name: item.name, category: item.category,
        price: grossiste(item.final), supplierPrice: grossiste(item.final), marginPercent: 20,
        linked: item.oldPrice ?? null,
        description: item.description, details: item.details, images: urls,
        status: 'available', featured: Boolean(item.featured), badge: item.badge ?? null,
        stock: item.stock, tags: item.tags, keywords: item.keywords,
        deliveryCities: CITIES, brand: '',
        deliveryInfo: 'Livraison 24 h à Douala et Yaoundé',
        warrantyInfo: 'Garantie 3 mois',
      }),
    });
    const body = await res.json();
    if (!res.ok) { failures.push(`${item.name}: HTTP ${res.status} ${JSON.stringify(body).slice(0, 160)}`); continue; }
    created += 1;
    console.log(`OK    ${item.name.padEnd(44)} id=${String(body.id).padEnd(3)} final=${String(body.finalPrice).padEnd(7)} img=${okCount}/${urls.length}`);
  }

  console.log(`\nCategories : ${catsCreated} creees`);
  console.log(`Produits   : ${created} crees, ${skipped} ignores, ${failures.length} alertes`);
  for (const f of failures) console.log(`  ! ${f}`);
}

main().catch((err) => { console.error('Erreur :', err.message); process.exit(1); });