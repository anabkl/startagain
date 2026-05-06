const PRODUCT_PLACEHOLDER = 'assets/products/product-placeholder.svg';

export const localCityKeywords = [
    'pharmacie tawfiq',
    'parapharmacie tawfiq',
    'parapharmacie.me',
    'parapharmacie Khouribga',
    'parapharmacie Oued Zem',
    'parapharmacie Boujniba',
    'parapharmacie Boulanouare',
    'parapharmacie Maroc',
    'livraison parapharmacie Maroc',
    'paiement a la livraison parapharmacie Maroc'
];

export const categories = [
    {
        slug: 'visage',
        name: 'Visage',
        arabicName: 'العناية بالوجه',
        icon: 'fa-spa',
        color: '#eaf7f1',
        description: 'Nettoyants, serums, hydratants et routines visage dermo-cosmetiques.'
    },
    {
        slug: 'corps',
        name: 'Corps',
        arabicName: 'العناية بالجسم',
        icon: 'fa-hand-sparkles',
        color: '#f7f3e8',
        description: 'Laits, baumes, gommages et soins corps pour le quotidien.'
    },
    {
        slug: 'cheveux',
        name: 'Cheveux',
        arabicName: 'العناية بالشعر',
        icon: 'fa-droplet',
        color: '#eef6ff',
        description: 'Shampooings, soins, huiles et routines cheveux.'
    },
    {
        slug: 'bebe-maman',
        name: 'Bébé & Maman',
        arabicName: 'الأم والطفل',
        icon: 'fa-baby',
        color: '#fff1f4',
        description: 'Soins doux, toilette, change et accessoires pour la famille.'
    },
    {
        slug: 'solaire',
        name: 'Solaire',
        arabicName: 'واقي الشمس',
        icon: 'fa-sun',
        color: '#fff6d8',
        description: 'Ecrans solaires, fluides SPF et textures adaptees au climat marocain.'
    },
    {
        slug: 'hygiene',
        name: 'Hygiène',
        arabicName: 'النظافة',
        icon: 'fa-pump-soap',
        color: '#edf7f6',
        description: 'Hygiene corps, dentaire, bain, toilette et formats famille.'
    },
    {
        slug: 'sante',
        name: 'Santé',
        arabicName: 'الصحة',
        icon: 'fa-heart-pulse',
        color: '#eef5ff',
        description: 'Tests, confort et produits de suivi bien-etre non substitutifs au conseil medical.'
    },
    {
        slug: 'complements-alimentaires',
        name: 'Compléments alimentaires',
        arabicName: 'مكملات غذائية',
        icon: 'fa-leaf',
        color: '#eef8e8',
        description: 'Vitamines et complements pour accompagner une alimentation variee.'
    },
    {
        slug: 'homme',
        name: 'Homme',
        arabicName: 'العناية بالرجل',
        icon: 'fa-user',
        color: '#eef3f4',
        description: 'Rasage, barbe, hygiene et soins visage pour homme.'
    },
    {
        slug: 'bio',
        name: 'Bio',
        arabicName: 'طبيعي',
        icon: 'fa-seedling',
        color: '#eff8e5',
        description: 'Selection bio ou eco-responsable pour les routines familiales.'
    },
    {
        slug: 'para-medical',
        name: 'Para-médical',
        arabicName: 'شبه طبي',
        icon: 'fa-kit-medical',
        color: '#edf4ff',
        description: 'Materiel de mesure, ortheses et accessoires para-medicaux.'
    },
    {
        slug: 'promotions',
        name: 'Promotions',
        arabicName: 'عروض',
        icon: 'fa-tags',
        color: '#fff0e8',
        description: 'Coffrets, offres temporaires et prix remises a confirmer avant expedition.'
    }
];

export const productImageFallbacks = {
    visage: 'assets/products/category-fallback-visage.webp',
    corps: 'assets/products/category-fallback-corps.webp',
    cheveux: 'assets/products/category-fallback-cheveux.webp',
    'bebe-maman': 'assets/products/category-fallback-bebe-maman.webp',
    solaire: 'assets/products/category-fallback-solaire.webp',
    hygiene: 'assets/products/category-fallback-hygiene.webp',
    sante: 'assets/products/category-fallback-sante.webp',
    'complements-alimentaires': 'assets/products/category-fallback-complements-alimentaires.webp',
    homme: 'assets/products/category-fallback-homme.webp',
    bio: 'assets/products/category-fallback-bio.webp',
    'para-medical': 'assets/products/category-fallback-para-medical.webp',
    promotions: 'assets/products/category-fallback-promotions.webp'
};

const categorySlugByName = Object.fromEntries(categories.map((category) => [category.name, category.slug]));

const descriptionByCategory = {
    Visage: 'Soin visage de parapharmacie pour completer une routine cosmetique claire, avec usage conseille selon le type de peau.',
    Corps: 'Soin corps ou toilette quotidienne pense pour le confort de la peau, sans promesse medicale.',
    Cheveux: 'Produit capillaire pour accompagner une routine cheveux simple, a utiliser selon les conseils de la marque.',
    'Bébé & Maman': 'Essentiel famille pour la toilette ou les accessoires bebe, avec confirmation de disponibilite avant expedition.',
    Solaire: 'Protection solaire ou soin SPF a integrer dans une routine de jour, en renouvelant selon les indications du fabricant.',
    Hygiène: 'Produit d hygiene pratique pour la maison, la salle de bain ou la routine quotidienne.',
    Santé: 'Produit de suivi ou de confort vendu en parapharmacie, a utiliser en complement des conseils d un professionnel si necessaire.',
    'Compléments alimentaires': 'Complement alimentaire a utiliser dans le cadre d une alimentation variee et d un mode de vie equilibre.',
    Homme: 'Soin homme pour le rasage, la barbe ou la routine visage, avec texture adaptee au quotidien.',
    Bio: 'Produit bio ou eco-responsable pour une routine plus naturelle, avec disponibilite a confirmer.',
    'Para-médical': 'Materiel para-medical ou accessoire de mesure a utiliser selon les instructions du fabricant.',
    Promotions: 'Offre promotionnelle sourcee sur le marche marocain, a confirmer au moment de la commande.'
};

const commonSearchKeywords = [
    'parapharmacie Maroc',
    'parapharmacie Khouribga',
    'produits cosmetiques',
    'soins visage',
    'livraison au Maroc',
    'paiement a la livraison',
    'COD',
    'WhatsApp'
];

const rawProducts = [
    {
        id: 'avene-cleanance-gel-400',
        name: 'AVÈNE Eau Thermale Cleanance Gel Nettoyant 400ml',
        brand: 'Avène',
        category: 'Visage',
        priceMAD: 227,
        sourceUrl: 'https://www.parapharma.ma/accueil/33930-avene-eau-thermale-cleanance-gel-nettoyant-400ml.html',
        tags: ['cleanance', 'gel nettoyant', 'peaux mixtes'],
        featured: true,
        bestseller: true
    },
    {
        id: 'avene-cleanance-gel-nettoyant-200',
        name: 'AVÈNE Cleanance Gel Nettoyant 200ml',
        brand: 'Avène',
        category: 'Visage',
        priceMAD: 151,
        sourceUrl: 'https://www.parapharma.ma/visage/246-avene-cleanance-gel-nettoyant-200ml-3282779349680.html',
        tags: ['cleanance', 'nettoyant visage']
    },
    {
        id: 'avene-cleanance-hydra-creme-lavante-200',
        name: 'Avène Cleanance Hydra Crème Lavante Apaisante 200ml',
        brand: 'Avène',
        category: 'Visage',
        priceMAD: 151,
        sourceUrl: 'https://www.parapharma.ma/visage/245-avene-clean-ac-creme-lavante-200ml-3282770100921.html',
        tags: ['cleanance hydra', 'creme lavante']
    },
    {
        id: 'avene-tolerance-lotion-nettoyante-gelifiee-200',
        name: 'AVÈNE Tolérance Lotion Nettoyante Gélifiée 200ml',
        brand: 'Avène',
        category: 'Visage',
        priceMAD: 142,
        sourceUrl: 'https://parapharma.ma/visage/31233-avene-tolerance-lotion-nettoyante-gelifiee-200ml.html',
        tags: ['tolerance', 'nettoyant sans rincage']
    },
    {
        id: 'bioderma-sensibio-gel-moussant-200',
        name: 'BIODERMA Sensibio Gel Moussant 200ml',
        brand: 'Bioderma',
        category: 'Visage',
        priceMAD: 168,
        sourceUrl: 'https://www.parapharma.ma/visage/14911-bioderma-sensibio-gel-moussant-nettoyant-douceur-peaux-sensibles-200-ml.html',
        tags: ['sensibio', 'gel moussant', 'peaux sensibles'],
        featured: true,
        bestseller: true
    },
    {
        id: 'bioderma-sensibio-h2o-ar-250',
        name: 'BIODERMA Sensibio H2O AR Anti-Rougeurs 250ml',
        brand: 'Bioderma',
        category: 'Visage',
        priceMAD: 125,
        sourceUrl: 'https://www.parapharma.ma/visage/9471-bioderma-sensibio-h2o-ar-anti-rougeurs-250-ml.html',
        tags: ['sensibio', 'eau micellaire']
    },
    {
        id: 'bioderma-sensibio-defensive-creme-40',
        name: 'BIODERMA Sensibio Defensive Crème 40ml',
        brand: 'Bioderma',
        category: 'Visage',
        priceMAD: 186,
        sourceUrl: 'https://www.parapharma.ma/visage/24976-bioderma-sensibio-defensive-creme-40ml.html',
        tags: ['sensibio', 'creme visage']
    },
    {
        id: 'bioderma-sensibio-defensive-riche-40',
        name: 'BIODERMA Sensibio Defensive Riche Crème 40ml',
        brand: 'Bioderma',
        category: 'Visage',
        priceMAD: 186,
        sourceUrl: 'https://www.parapharma.ma/visage/24975-bioderma-sensibio-defensive-riche-creme-40ml.html',
        tags: ['sensibio', 'creme riche']
    },
    {
        id: 'bioderma-sensibio-ar-creme-40',
        name: 'BIODERMA Sensibio AR Crème 40ml',
        brand: 'Bioderma',
        category: 'Visage',
        priceMAD: 169,
        sourceUrl: 'https://www.parapharma.ma/visage/20683-bioderma-sensibio-ar-creme-40ml-anti-rougeurs.html',
        tags: ['sensibio ar', 'creme visage']
    },
    {
        id: 'bioderma-sensibio-mask-75',
        name: 'Bioderma Sensibio Mask Masque Apaisant 75ml',
        brand: 'Bioderma',
        category: 'Visage',
        priceMAD: 157,
        sourceUrl: 'https://www.parapharma.ma/visage/21852-bioderma-sensibio-mask-masque-apaisant-75-ml.html',
        tags: ['masque visage', 'sensibio']
    },
    {
        id: 'bioderma-sebium-pore-refiner-concentre-offre',
        name: 'BIODERMA Sebium Pore Refiner Concentré 30ml + Sebium H2O 250ml offert',
        brand: 'Bioderma',
        category: 'Promotions',
        priceMAD: 166,
        oldPriceMAD: 298,
        promoBadge: '-132 DHS',
        sourceUrl: 'https://parapharma.ma/visage/25724-bioderma-sebium-pore-refiner-concentre-30-ml-achete-bioderma-sebium-h2o-250ml-offert-.html',
        tags: ['sebium', 'promotion', 'offre visage'],
        featured: true
    },
    {
        id: 'la-roche-posay-toleriane-sensitive-riche-40',
        name: 'LA ROCHE-POSAY Toleriane Sensitive Riche 40ml',
        brand: 'La Roche-Posay',
        category: 'Visage',
        priceMAD: 151,
        sourceUrl: 'https://www.parapharma.ma/visage/191-la-roche-posay-toleriane-riche-40ml-creme-riche-protectrice-apaisante.html',
        tags: ['toleriane', 'creme visage']
    },
    {
        id: 'la-roche-posay-toleriane-sensitive-soin-40',
        name: 'LA ROCHE-POSAY Toleriane Sensitive Soin Hydratant 40ml',
        brand: 'La Roche-Posay',
        category: 'Visage',
        priceMAD: 151,
        sourceUrl: 'https://www.parapharma.ma/visage/542-la-roche-posay-toleriane-creme-40ml-soin-protecteur-apaisant.html',
        tags: ['toleriane', 'hydratant']
    },
    {
        id: 'la-roche-posay-toleriane-fluide-dermo-nettoyant-200',
        name: 'LA ROCHE-POSAY Toleriane Fluide Dermo-Nettoyant 200ml',
        brand: 'La Roche-Posay',
        category: 'Visage',
        priceMAD: 140,
        sourceUrl: 'https://www.parapharma.ma/visage/411-la-roche-posay-toleriane-fluide-dermo-nettoyant-200ml-nettoie-et-demaquille-le-visage-et-les-yeux.html',
        tags: ['demaquillant', 'toleriane']
    },
    {
        id: 'la-roche-posay-cicaplast-baume-b5-100',
        name: 'LA ROCHE-POSAY Cicaplast Baume B5+ 100ml',
        brand: 'La Roche-Posay',
        category: 'Corps',
        priceMAD: 183,
        sourceUrl: 'https://www.parapharma.ma/visage/7751-la-roche-posay-cicaplast-baume-b5-100ml.html',
        tags: ['cicaplast', 'baume']
    },
    {
        id: 'la-roche-posay-cicaplast-levres-75',
        name: 'LA ROCHE-POSAY Cicaplast Lèvres 7,5ml',
        brand: 'La Roche-Posay',
        category: 'Visage',
        priceMAD: 82,
        sourceUrl: 'https://www.parapharma.ma/visage/18149-la-roche-posay-cicaplast-levres-75-ml.html',
        tags: ['levres', 'cicaplast']
    },
    {
        id: 'la-roche-posay-hyalu-b5-serum-30',
        name: 'LA ROCHE-POSAY Hyalu B5 Sérum 30ml',
        brand: 'La Roche-Posay',
        category: 'Visage',
        priceMAD: 361,
        sourceUrl: 'https://www.parapharma.ma/visage/19117-la-roche-posay-hyalu-b5-serum-30ml.html',
        tags: ['serum', 'hyalu b5']
    },
    {
        id: 'la-roche-posay-hydraphase-ha-riche-50',
        name: 'LA ROCHE-POSAY Hydraphase HA Riche 50ml',
        brand: 'La Roche-Posay',
        category: 'Visage',
        priceMAD: 228,
        sourceUrl: 'https://www.parapharma.ma/visage/22208-la-roche-posay-hydraphase-ha-riche-50ml.html',
        tags: ['hydraphase', 'creme visage']
    },
    {
        id: 'la-roche-posay-effaclar-h-iso-biome-40',
        name: 'La Roche-Posay Effaclar H Iso-Biome Soin 40ml',
        brand: 'La Roche-Posay',
        category: 'Visage',
        priceMAD: 157,
        sourceUrl: 'https://www.parapharma.ma/visage/25065-la-roche-posay-effaclar-h-iso-biome-soin-reparateur-apaisant-anti-marques-40-ml.html',
        tags: ['effaclar', 'soin visage']
    },
    {
        id: 'la-roche-posay-lipikar-gel-lavant-400',
        name: 'La Roche-Posay Lipikar Gel Lavant 400ml',
        brand: 'La Roche-Posay',
        category: 'Hygiène',
        priceMAD: 128,
        sourceUrl: 'https://parapharma.ma/visage/12219-la-roche-posay-lipikar-gel-lavant-400ml.html',
        tags: ['lipikar', 'gel lavant']
    },
    {
        id: 'la-roche-posay-lipikar-lait-urea-400',
        name: 'LA ROCHE-POSAY Lipikar Lait Urea 10+ 400ml',
        brand: 'La Roche-Posay',
        category: 'Corps',
        priceMAD: 242,
        sourceUrl: 'https://www.parapharma.ma/corps/24456-la-roche-posay-lipikar-lait-urea-5-peau-sensible-tres-seche-400ml.html',
        tags: ['lipikar', 'lait corps']
    },
    {
        id: 'cerave-huile-lavante-moussante-hydratante-236',
        name: 'CeraVe Huile Lavante Moussante Hydratante 236ml',
        brand: 'CeraVe',
        category: 'Hygiène',
        priceMAD: 104,
        sourceUrl: 'https://www.parapharma.ma/visage/23213-cerave-huile-lavante-moussante-hydratante-236ml.html',
        tags: ['huile lavante', 'cerave'],
        featured: true
    },
    {
        id: 'cerave-creme-hydratante-visage-52',
        name: 'CeraVe Crème Hydratante Visage 52ml',
        brand: 'CeraVe',
        category: 'Visage',
        priceMAD: 102,
        sourceUrl: 'https://www.parapharma.ma/visage/21217-cerave-creme-hydratante-visage-52-ml.html',
        tags: ['creme visage', 'cerave'],
        featured: true
    },
    {
        id: 'cerave-creme-hydratante-visage-spf50-40',
        name: 'CeraVe Crème Hydratante Visage SPF50 40ml',
        brand: 'CeraVe',
        category: 'Solaire',
        priceMAD: 115,
        sourceUrl: 'https://www.parapharma.ma/visage/25202-cerave-creme-hydratante-visage-spf50-peaux-normales-a-seches-52ml.html',
        tags: ['spf50', 'cerave', 'solaire']
    },
    {
        id: 'svr-ampoule-b3-30',
        name: 'SVR Ampoule B3 30ml',
        brand: 'SVR',
        category: 'Visage',
        priceMAD: 360,
        sourceUrl: 'https://parapharma.ma/visage/21621-svr-ampoule-b-30ml.html',
        tags: ['ampoule b3', 'serum'],
        bestseller: true
    },
    {
        id: 'svr-clairial-ampoule-30',
        name: 'SVR Clairial Ampoule 30ml',
        brand: 'SVR',
        category: 'Visage',
        priceMAD: 355,
        sourceUrl: 'https://www.parapharma.ma/accueil/30473-svr-clairial-ampoule-30ml.html',
        tags: ['clairial', 'serum visage']
    },
    {
        id: 'svr-topialyse-gel-lavant-1l',
        name: 'SVR Topialyse Gel Lavant 1L',
        brand: 'SVR',
        category: 'Hygiène',
        priceMAD: 263,
        sourceUrl: 'https://www.parapharma.ma/maquillage/25651-svr-topialyse-gel-lavant-1l.html',
        tags: ['topialyse', 'format famille']
    },
    {
        id: 'isdin-acniben-gel-nettoyant-400',
        name: 'ISDIN Acniben Gel Nettoyant Matifiant 400ml',
        brand: 'ISDIN',
        category: 'Visage',
        priceMAD: 230,
        sourceUrl: 'https://parapharma.ma/accueil/30471-isdin-acniben-1-gel-nettoyant-matifiant-400-ml.html',
        tags: ['acniben', 'gel nettoyant'],
        bestseller: true
    },
    {
        id: 'centaurea-creme-solaire-invisible-spf50-125',
        name: 'CENTAUREA Crème Solaire Invisible SPF50+ 125ml',
        brand: 'Centaurea',
        category: 'Solaire',
        priceMAD: 229,
        sourceUrl: 'https://www.parapharma.ma/solaire/22424-centaurea-creme-solaire-invisible-spf50-125ml.html',
        tags: ['spf50', 'solaire']
    },
    {
        id: 'photowhite-creme-solaire-spf50-invisible-50',
        name: 'PHOTOWHITE Crème Solaire SPF50 Invisible 50ml',
        brand: 'Photowhite',
        category: 'Solaire',
        priceMAD: 185,
        sourceUrl: 'https://www.parapharma.ma/solaire/14941-photowhite-creme-solaire-invisible-50ml.html',
        tags: ['spf50', 'anti taches']
    },
    {
        id: 'dermaskin-creme-solaire-spf50-anti-tache-50',
        name: 'DERMASKIN Crème Solaire SPF50+ Anti-Tache 50ml',
        brand: 'Dermaskin',
        category: 'Solaire',
        priceMAD: 132,
        sourceUrl: 'https://www.parapharma.ma/solaire/16146-dermaskin-creme-solaire-spf-50-anti-tache-50ml.html',
        tags: ['spf50', 'solaire visage']
    },
    {
        id: 'uriage-bariesun-fluide-ultra-leger-spf50-30',
        name: 'URIAGE Bariésun Fluide Ultra-Léger SPF50+ 30ml',
        brand: 'Uriage',
        category: 'Solaire',
        priceMAD: 91,
        sourceUrl: 'https://parapharma.ma/solaire/15065-uriage-solaire-bariesun-fluide-ultra-leger-spf50-30ml-30ml.html',
        tags: ['bariesun', 'spf50']
    },
    {
        id: 'dermagor-creme-solaire-teintee-spf50-100',
        name: 'Dermagor Crème Solaire Teintée SPF50+ 100ml',
        brand: 'Dermagor',
        category: 'Solaire',
        priceMAD: 149,
        sourceUrl: 'https://www.parapharma.ma/solaire/22206-dermagor-creme-solaire-teintee-tres-haute-protection-spf50-100-ml.html',
        tags: ['teinte', 'spf50']
    },
    {
        id: 'mesoestetic-mesoprotech-melan-130-spf50-50',
        name: 'MESOESTETIC Mesoprotech Melan 130 SPF50+ 50ml',
        brand: 'Mesoestetic',
        category: 'Solaire',
        priceMAD: 299,
        sourceUrl: 'https://parapharma.ma/solaire/21570-mesoestetic-melan-130-pigment-control-50-ml.html',
        tags: ['mesoprotech', 'spf50']
    },
    {
        id: 'chateau-rouge-fluide-solaire-anti-tache-spf50-50',
        name: 'Château Rouge Fluide Solaire Anti-Tache SPF50+ 50ml',
        brand: 'Château Rouge',
        category: 'Solaire',
        priceMAD: 198,
        sourceUrl: 'https://parapharma.ma/solaire/25091-chateau-rouge-fluide-solaire-anti-tache-spf-50-50ml-3760065960455.html',
        tags: ['spf50', 'fluide solaire']
    },
    {
        id: 'dermacare-parasun-creme-solaire-spf50-teintee-50',
        name: 'DERMACARE PARASUN Crème Solaire SPF50+ Teintée 50ml',
        brand: 'Dermacare',
        category: 'Solaire',
        priceMAD: 179,
        sourceUrl: 'https://www.parapharma.ma/solaire/15135-dermacare-parasun-creme-solaire-spf-50-teintee-50-ml.html',
        tags: ['teinte', 'spf50']
    },
    {
        id: 'uriage-xemose-huile-lavante-apaisante-500',
        name: 'URIAGE Xémose Huile Lavante Apaisante 500ml',
        brand: 'Uriage',
        category: 'Corps',
        priceMAD: 135,
        sourceUrl: 'https://www.parapharma.ma/visage/6822-uriage-xemose-huile-nettoyante-apaisante-400ml.html',
        tags: ['xemose', 'huile lavante'],
        featured: true,
        bestseller: true
    },
    {
        id: 'uriage-huile-lavante-500',
        name: 'Uriage Huile Lavante 500ml',
        brand: 'Uriage',
        category: 'Hygiène',
        priceMAD: 193,
        sourceUrl: 'https://www.parapharma.ma/hygiene/29343-uriage-huile-lavante-500-ml-.html',
        tags: ['huile lavante', 'hygiene']
    },
    {
        id: 'uriage-xemose-syndet-200',
        name: 'URIAGE Xémose Syndet 200ml',
        brand: 'Uriage',
        category: 'Hygiène',
        priceMAD: 142,
        sourceUrl: 'https://www.parapharma.ma/visage/8899-uriage-xemose-syndet-200ml.html',
        tags: ['xemose', 'syndet']
    },
    {
        id: 'uriage-xemose-baume-oleo-apaisant-500',
        name: 'Uriage Xémose Baume Oléo-Apaisant 500ml',
        brand: 'Uriage',
        category: 'Corps',
        priceMAD: 222,
        sourceUrl: 'https://www.parapharma.ma/corps/19394-uriage-xemose-baume-oleo-apaisant-anti-grattage-500-ml.html',
        tags: ['xemose', 'baume corps']
    },
    {
        id: 'roge-cavailles-huile-lavante-surgras-500',
        name: 'ROGÉ CAVAILLÈS Dermo-UHT Huile Lavante Surgras 500ml',
        brand: 'Rogé Cavaillès',
        category: 'Hygiène',
        priceMAD: 159,
        sourceUrl: 'https://www.parapharma.ma/hygiene/22009-roge-cavailles-dermo-uht-huile-lavante-surgras-500-ml.html',
        tags: ['huile lavante', 'surgras'],
        featured: true
    },
    {
        id: 'roge-cavailles-creme-lavante-surgras-500',
        name: 'ROGÉ CAVAILLÈS Dermo-UHT Crème Lavante Surgras 500ml',
        brand: 'Rogé Cavaillès',
        category: 'Hygiène',
        priceMAD: 145,
        sourceUrl: 'https://www.parapharma.ma/accueil/28854-roge-cavailles-dermo-uht-creme-lavante-surgras-500ml.html',
        tags: ['creme lavante', 'surgras']
    },
    {
        id: 'roge-cavailles-gel-lavant-surgras-500',
        name: 'ROGÉ CAVAILLÈS Dermo-UHT Gel Lavant Surgras 500ml',
        brand: 'Rogé Cavaillès',
        category: 'Hygiène',
        priceMAD: 149,
        sourceUrl: 'https://www.parapharma.ma/hygiene/19612-roge-cavailles-dermo-uht-gel-lavant-surgras-500-ml.html',
        promoBadge: 'Promotion',
        tags: ['gel lavant', 'surgras']
    },
    {
        id: 'nuxe-body-reve-de-the-gommage-150',
        name: 'Nuxe Body Rêve de Thé Gommage 150ml',
        brand: 'Nuxe',
        category: 'Corps',
        priceMAD: 229,
        sourceUrl: 'https://www.parapharma.ma/corps/24721-nuxe-body-reve-de-the-gommage-150ml-3264680022005.html',
        tags: ['gommage', 'corps']
    },
    {
        id: 'arkopharma-forcapil-cheveux-ongles-180-60-offert',
        name: 'Arkopharma Forcapil Cheveux et Ongles 180 gélules + 60 offertes',
        brand: 'Arkopharma',
        category: 'Compléments alimentaires',
        priceMAD: 356,
        sourceUrl: 'https://parapharma.ma/accueil/32451-arkopharma-forcapil-cheveux-et-ongles-180-gelules-60-gelules-offert-.html',
        tags: ['forcapil', 'cheveux', 'ongles'],
        featured: true,
        bestseller: true
    },
    {
        id: 'forte-pharma-acerola-vitamine-c-b20',
        name: 'FORTÉ PHARMA Acérola Vitamine C B20 Effervescents',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 95,
        sourceUrl: 'https://www.parapharma.ma/accueil/34745-forte-pharma-acerola-vitamine-c-b20-effervescents.html',
        tags: ['vitamine c', 'acerola'],
        bestseller: true
    },
    {
        id: 'forte-pharma-immuvit4g-30-comprimes',
        name: 'FORTÉ PHARMA ImmuVit 4G Multivitamines 30 comprimés',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 179,
        sourceUrl: 'https://www.parapharma.ma/sante/29517-forte-pharma-immuvit4g-multivitamines-et-immunite-30-comprimes-3700221300275.html',
        tags: ['multivitamines', 'bien etre']
    },
    {
        id: 'forte-pharma-spiruline-forte-1500-30',
        name: 'Forté Pharma Spiruline Forte 1500mg 30 comprimés',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 125,
        sourceUrl: 'https://www.parapharma.ma/accueil/30610-forte-pharma-spiruline-forte-1500mg-30-comprimes-3700221317747.html',
        tags: ['spiruline', 'routine bien etre']
    },
    {
        id: 'forte-pharma-fortebiotic-atb-10-gelules',
        name: 'Forté Pharma FortéBiotic+ ATB 10 gélules',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 149,
        sourceUrl: 'https://www.parapharma.ma/sante/24654-forte-pharma-fortebiotic-atb-10-gelules.html',
        tags: ['fortebiotic', 'microbiotiques']
    },
    {
        id: 'forte-pharma-forte-gelee-royale-20-ampoules',
        name: 'Forté Pharma Forte Gelée Royale 20 ampoules x 10ml',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 215,
        sourceUrl: 'https://www.parapharma.ma/accueil/32937-forte-pharma-forte-gelee-royale-20-ampoule-x-10ml-3700221312995.html',
        tags: ['gelee royale', 'ampoules']
    },
    {
        id: 'forte-pharma-ultra-boost-4g-effer-20',
        name: 'FORTÉ PHARMA Ultra Boost 4G Effervescent 20 comprimés',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 145,
        sourceUrl: 'https://www.parapharma.ma/sante/20843-forte-pharma-ultra-boost-4g-effer-20-comprimes-3700221313916.html',
        tags: ['effervescent', 'tonus']
    },
    {
        id: 'forte-pharma-turbo-draine-agrumes-500',
        name: 'Forté Pharma Turbo Draine Agrumes 500ml',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 189,
        sourceUrl: 'https://www.parapharma.ma/sante/25541-forte-pharma-turbo-draine-agrumes-500ml.html',
        tags: ['draineur', 'agrumes']
    },
    {
        id: 'forte-pharma-forte-detox-5-organes-500',
        name: 'Forté Pharma Forte Detox 5 Organes 500ml',
        brand: 'Forté Pharma',
        category: 'Compléments alimentaires',
        priceMAD: 205,
        sourceUrl: 'https://parapharma.ma/accueil/30609-forte-pharma-forte-detox-5-organes-500ml-3700221313886.html',
        tags: ['detox', 'routine bien etre']
    },
    {
        id: 'mustela-gel-2en1-bebe-200',
        name: 'MUSTELA Gel 2en1 Bébé 200ml',
        brand: 'Mustela',
        category: 'Bébé & Maman',
        priceMAD: 80,
        sourceUrl: 'https://citymall-para.ma/produit/mustela-gel-2en1-bebe-200ml/',
        tags: ['bebe', 'gel 2en1'],
        featured: true
    },
    {
        id: 'mustela-gel-lavant-doux-500',
        name: 'MUSTELA Gel Lavant Doux 500ml',
        brand: 'Mustela',
        category: 'Bébé & Maman',
        priceMAD: 149,
        sourceUrl: 'https://www.parapharma.ma/bebe-maman/19129-mustela-gel-lavant-doux-500ml.html',
        tags: ['bebe', 'gel lavant'],
        bestseller: true
    },
    {
        id: 'mustela-musti-eau-de-soin-parfumee-50',
        name: 'Mustela Musti Eau de Soin Parfumée 50ml',
        brand: 'Mustela',
        category: 'Bébé & Maman',
        priceMAD: 109,
        sourceUrl: 'https://parapharma.ma/bebe-maman/14015-mustela-musti-eau-de-soin-parfumee-50ml.html',
        tags: ['bebe', 'eau de soin']
    },
    {
        id: 'uriage-bebe-premiere-creme-lavante-500',
        name: 'URIAGE Bébé 1ère Crème Lavante 500ml',
        brand: 'Uriage',
        category: 'Bébé & Maman',
        priceMAD: 171,
        sourceUrl: 'https://parapharma.ma/bebe-maman/17248-uriage-bebe-1ere-eau-creme-lavante-visage-corps-et-cuir-chevelu-500ml.html',
        tags: ['bebe', 'creme lavante']
    },
    {
        id: 'uriage-bebe-huile-lavante-apaisante-500',
        name: 'Uriage Bébé 1er Huile Lavante Apaisante 500ml',
        brand: 'Uriage',
        category: 'Bébé & Maman',
        priceMAD: 174,
        sourceUrl: 'https://www.parapharma.ma/bebe-maman/24269-uriage-bebe-1er-huile-lavante-apaisante-500ml.html',
        tags: ['bebe', 'huile lavante']
    },
    {
        id: 'uriage-bebe-premiere-creme-hydratante-40',
        name: 'URIAGE Bébé 1ère Crème Hydratante 40ml',
        brand: 'Uriage',
        category: 'Bébé & Maman',
        priceMAD: 95,
        sourceUrl: 'https://parapharma.ma/bebe-maman/8908-uriage-1ere-creme-nourrissons-bebes.html',
        tags: ['bebe', 'creme hydratante']
    },
    {
        id: 'natessance-bebe-eau-nettoyante-500',
        name: 'Natessance Bébé Eau Nettoyante 500ml',
        brand: 'Natessance',
        category: 'Bébé & Maman',
        priceMAD: 125,
        sourceUrl: 'https://parapharma.ma/bebe-maman/23918-natessance-bebe-eau-nettoyante-500ml.html',
        tags: ['bebe', 'eau nettoyante']
    },
    {
        id: 'jerraflore-huile-douceur-bebe-maman-150',
        name: 'Jerraflore Huile Douceur Bébé / Maman 150ml',
        brand: 'Jerraflore',
        category: 'Bébé & Maman',
        priceMAD: 112,
        sourceUrl: 'https://parapharma.ma/accueil/30947-jerraflore-huile-douceur-bebe-maman-150ml.html',
        tags: ['bebe', 'maman', 'huile douceur']
    },
    {
        id: 'dodie-lait-toilette-3en1-500',
        name: 'DODIE Lait de Toilette 3 en 1 500ml',
        brand: 'Dodie',
        category: 'Bébé & Maman',
        priceMAD: 129,
        sourceUrl: 'https://parapharma.ma/bebe-maman/17023-dodie-lait-de-toilette-3-en-1-500ml.html',
        tags: ['dodie', 'lait de toilette']
    },
    {
        id: 'dodie-biberon-sensation-270-jardin',
        name: 'DODIE Biberon Sensation+ 270ml Jardin',
        brand: 'Dodie',
        category: 'Bébé & Maman',
        priceMAD: 103,
        sourceUrl: 'https://parapharma.ma/bebe-maman/25368-dodie-biberon-sensation-270ml-jardin-.html',
        tags: ['dodie', 'biberon']
    },
    {
        id: 'dodie-biberon-col-etroit-verre-240-bleu-lagoon',
        name: 'DODIE Biberon Col Étroit Verre 240ml Bleu Lagoon',
        brand: 'Dodie',
        category: 'Bébé & Maman',
        priceMAD: 98,
        sourceUrl: 'https://parapharma.ma/bebe-maman/28836-dodie-biberon-col-etroit-verre-240ml-bleu-lagoon.html',
        tags: ['dodie', 'biberon verre']
    },
    {
        id: 'dodie-sucette-anatomique-18m-duo-girly',
        name: 'DODIE Sucette Anatomique A71 +18m Duo Girly',
        brand: 'Dodie',
        category: 'Bébé & Maman',
        priceMAD: 95,
        sourceUrl: 'https://parapharma.ma/bebe-maman/25309-dodie-sucette-anatomique-71-18m-duo-girly-.html',
        tags: ['dodie', 'sucette']
    },
    {
        id: 'dodie-porte-biberon-isotherme',
        name: 'DODIE Porte Biberon Isotherme',
        brand: 'Dodie',
        category: 'Bébé & Maman',
        priceMAD: 260,
        sourceUrl: 'https://parapharma.ma/bebe-maman/25286-dodie-porte-biberon-isotherme.html',
        tags: ['dodie', 'accessoire bebe']
    },
    {
        id: 'weleda-bebe-creme-lavante-corps-cheveux-bio-duo',
        name: 'WELEDA Bébé Duo Crème Lavante Corps & Cheveux Bio 200ml',
        brand: 'Weleda',
        category: 'Bio',
        priceMAD: 150,
        oldPriceMAD: 193,
        promoBadge: '-43 DHS',
        sourceUrl: 'https://parapharma.ma/bio/21131-weleda-bebe-creme-lavante-corps-cheveux-bio-200ml-achete-1-offert-.html',
        tags: ['bio', 'bebe', 'weleda']
    },
    {
        id: 'ecosnug-liquide-vaisselle-ecologique-bebe-500',
        name: 'Ecosnug Liquide Vaisselle Écologique pour Bébé 500ml',
        brand: 'Ecosnug',
        category: 'Bio',
        priceMAD: 60,
        sourceUrl: 'https://parapharma.ma/',
        tags: ['eco', 'bebe', 'maison']
    },
    {
        id: 'ecolunes-lessive-bebe-ecologique-1l',
        name: 'ECOLUNES Lessive Bébé Écologique et Hypoallergénique 1L',
        brand: 'Ecolunes',
        category: 'Bio',
        priceMAD: 120,
        sourceUrl: 'https://parapharma.ma/',
        tags: ['lessive bebe', 'eco']
    },
    {
        id: 'vichy-homme-mousse-raser-anti-irritations-200',
        name: 'VICHY Homme Mousse à Raser Anti-Irritations 200ml',
        brand: 'Vichy',
        category: 'Homme',
        priceMAD: 129,
        sourceUrl: 'https://www.parapharma.ma/homme/2602-vichy-homme-mousse-a-raser-anti-irritations-200ml.html',
        tags: ['rasage', 'homme']
    },
    {
        id: 'vichy-homme-gel-rasage-anti-irritations-150',
        name: 'VICHY Homme Gel de Rasage Anti-Irritations 150ml',
        brand: 'Vichy',
        category: 'Homme',
        priceMAD: 142,
        sourceUrl: 'https://www.parapharma.ma/homme/2601-vichy-homme-gel-de-rasage-anti-irritations-150ml.html',
        tags: ['rasage', 'homme']
    },
    {
        id: 'vichy-homme-sensi-baume-mineral-ca-75',
        name: 'VICHY Homme Sensi-Baume Mineral CA 75ml',
        brand: 'Vichy',
        category: 'Homme',
        priceMAD: 185,
        sourceUrl: 'https://www.parapharma.ma/homme/2582-vichy-homme-sensi-baume-mineral-ca-75ml.html',
        tags: ['apres rasage', 'homme']
    },
    {
        id: 'nuxe-men-gel-rasage-anti-irritations-150',
        name: 'NUXE Men Gel de Rasage Anti-Irritations 150ml',
        brand: 'Nuxe',
        category: 'Homme',
        priceMAD: 149,
        sourceUrl: 'https://www.parapharma.ma/15-homme',
        tags: ['nuxe men', 'rasage']
    },
    {
        id: 'ecrinal-lotion-anp-homme-200',
        name: 'ECRINAL Lotion ANP Homme 200ml',
        brand: 'Ecrinal',
        category: 'Homme',
        priceMAD: 260,
        sourceUrl: 'https://parapharma.ma/homme/2618-ecrinal-lotion-anp-homme-200ml.html',
        tags: ['cheveux homme', 'lotion']
    },
    {
        id: 'gum-gratte-langue-double-action',
        name: 'GUM Gratte-Langue Double Action',
        brand: 'GUM',
        category: 'Hygiène',
        priceMAD: 46,
        sourceUrl: 'https://www.parapharma.ma/16-hygiene',
        tags: ['dentaire', 'gum']
    },
    {
        id: 'gum-kit-voyage-ref-156',
        name: 'GUM Kit de Voyage Ref 156',
        brand: 'GUM',
        category: 'Hygiène',
        priceMAD: 89,
        sourceUrl: 'https://www.parapharma.ma/16-hygiene',
        tags: ['dentaire', 'voyage']
    },
    {
        id: 'gum-dentifrice-menthe-promotion',
        name: 'GUM Dentifrice Menthe',
        brand: 'GUM',
        category: 'Promotions',
        priceMAD: 102,
        oldPriceMAD: 140,
        promoBadge: '-38 DHS',
        sourceUrl: 'https://www.parapharma.ma/508-journee-des-gratuits',
        tags: ['dentaire', 'promotion']
    },
    {
        id: 'vitis-gingival-dentifrice-promotion',
        name: 'Vitis Gingival Dentifrice',
        brand: 'Vitis',
        category: 'Promotions',
        priceMAD: 125,
        oldPriceMAD: 157,
        promoBadge: '-32 DHS',
        sourceUrl: 'https://www.parapharma.ma/',
        tags: ['dentaire', 'promotion']
    },
    {
        id: 'accu-chek-instant-bandelettes-x50',
        name: 'Accu-Chek Instant Bandelettes x50',
        brand: 'Accu-Chek',
        category: 'Para-médical',
        priceMAD: 188,
        sourceUrl: 'https://parapharma.ma/para-medical/21476-accu-check-instant-bandelettes-x50.html',
        tags: ['glycemie', 'bandelettes'],
        bestseller: true
    },
    {
        id: 'releveur-de-pied-4731hd',
        name: 'Releveur de Pied 4731HD',
        brand: 'Para-médical',
        category: 'Para-médical',
        priceMAD: 506,
        sourceUrl: 'https://parapharma.ma/para-medical/13680-releveur-de-pied-4731hd.html',
        tags: ['orthese', 'confort']
    },
    {
        id: 'test-de-grossesse',
        name: 'Test de Grossesse',
        brand: 'Parapharma',
        category: 'Santé',
        priceMAD: 15,
        sourceUrl: 'https://www.parapharma.ma/bebe-maman/7753-test-de-grossesse.html',
        tags: ['test', 'grossesse']
    },
    {
        id: 'gilbert-elletest-test-grossesse-1-test',
        name: 'Gilbert Elletest Test de Grossesse - 1 test',
        brand: 'Gilbert',
        category: 'Santé',
        priceMAD: 22,
        sourceUrl: 'https://www.parapharma.ma/accueil/32799-gilbert-elletest-test-de-grossesse-1-test.html',
        tags: ['test', 'grossesse']
    },
    {
        id: 'tensiometre-electronique-brassard-767s',
        name: 'Tensiomètre Électronique à Brassard 767S',
        brand: 'Para-médical',
        category: 'Para-médical',
        priceMAD: 760,
        sourceUrl: 'https://parapharma.ma/accueil/28697-tensiometre-electronique-a-brassard-767s-0095tb76.html',
        tags: ['tensiometre', 'mesure']
    },
    {
        id: 'thuasne-ceinture-soutien-lombaire-361',
        name: 'THUASNE Ceinture de Soutien Lombaire 361',
        brand: 'Thuasne',
        category: 'Para-médical',
        priceMAD: 540,
        sourceUrl: 'https://parapharma.ma/accueil/28577-thuasne-ceinture-de-soutien-lombaire-361.html',
        tags: ['ceinture lombaire', 'orthese']
    },
    {
        id: 'nuxe-coffret-prodigieux-glow-en-rose',
        name: 'NUXE Coffret Prodigieux Glow en Rose',
        brand: 'Nuxe',
        category: 'Promotions',
        priceMAD: 468,
        promoBadge: 'Coffret',
        sourceUrl: 'https://parapharma.ma/',
        tags: ['coffret', 'nuxe', 'glow'],
        featured: true
    },
    {
        id: 'nuxe-coffret-nuxuriance-ultra-routine-anti-age',
        name: 'NUXE Coffret Nuxuriance Ultra Routine Anti-Âge Global',
        brand: 'Nuxe',
        category: 'Promotions',
        priceMAD: 765,
        oldPriceMAD: 850,
        promoBadge: '-10%',
        sourceUrl: 'https://www.parapharma.ma/visage/33952-nuxe-coffret-nuxuriance-ultra-la-routine-anti-age-global.html',
        tags: ['coffret', 'nuxe']
    },
    {
        id: 'nuxe-coffret-fragrance-iconique',
        name: 'NUXE Coffret Fragrance Iconique',
        brand: 'Nuxe',
        category: 'Promotions',
        priceMAD: 378,
        oldPriceMAD: 420,
        promoBadge: '-10%',
        sourceUrl: 'https://www.parapharma.ma/maquillage/33944-nuxe-coffret-fragrance-iconique.html',
        tags: ['coffret', 'parfum']
    },
    {
        id: 'caudalie-coffret-solution-fermete',
        name: 'CAUDALIE Coffret La Solution Fermeté',
        brand: 'Caudalie',
        category: 'Promotions',
        priceMAD: 567,
        oldPriceMAD: 630,
        promoBadge: '-10%',
        sourceUrl: 'https://parapharma.ma/accueil/33550-caudalie-coffret-la-solution-fermete.html',
        tags: ['coffret', 'caudalie'],
        featured: true
    },
    {
        id: 'caudalie-coffret-premier-cru-yeux',
        name: 'CAUDALIE Coffret Premier Cru Yeux',
        brand: 'Caudalie',
        category: 'Promotions',
        priceMAD: 536,
        oldPriceMAD: 595,
        promoBadge: '-10%',
        sourceUrl: 'https://www.parapharma.ma/accueil/33549-caudalie-coffret-premier-cru-yeux-.html',
        tags: ['coffret', 'caudalie']
    },
    {
        id: 'eucerin-anti-pigment-serum-duo-offre',
        name: 'EUCERIN Anti-Pigment Sérum Duo 30ml + Fluide SPF50 offert',
        brand: 'Eucerin',
        category: 'Promotions',
        priceMAD: 529,
        oldPriceMAD: 785,
        promoBadge: '-256 DHS',
        sourceUrl: 'https://www.parapharma.ma/accueil/27757-eucerin-anti-pigment-serum-duo-30ml-achete-hydro-protect-fluide-ultra-leger-spf-50-offert.html',
        tags: ['eucerin', 'serum', 'offre']
    },
    {
        id: 'eucerin-ecran-anti-pigment-promotion',
        name: 'EUCERIN Écran Anti-Pigment',
        brand: 'Eucerin',
        category: 'Promotions',
        priceMAD: 169,
        oldPriceMAD: 209,
        promoBadge: '-19%',
        sourceUrl: 'https://www.parapharma.ma/508-journee-des-gratuits',
        tags: ['eucerin', 'solaire', 'promotion']
    },
    {
        id: 'baby-nooz-seringue-nasale-promotion',
        name: 'Baby Nooz Seringue Nasale',
        brand: 'Baby Nooz',
        category: 'Promotions',
        priceMAD: 30,
        oldPriceMAD: 60,
        promoBadge: '-50%',
        sourceUrl: 'https://www.parapharma.ma/',
        tags: ['bebe', 'promotion']
    },
    {
        id: 'perfectil-triple-action',
        name: 'Perfectil Triple Action',
        brand: 'Perfectil',
        category: 'Compléments alimentaires',
        priceMAD: 158,
        sourceUrl: 'https://www.parapharma.ma/',
        tags: ['cheveux', 'ongles', 'peau']
    }
];

function createProduct(product, index) {
    const categorySlug = categorySlugByName[product.category];
    const ratingSeed = (index % 4) / 10;
    const reviews = 18 + ((index * 7) % 84);
    const hasPromo = Boolean(product.oldPriceMAD && product.oldPriceMAD > product.priceMAD);
    const fallbackImage = productImageFallbacks[categorySlug] || PRODUCT_PLACEHOLDER;
    const image = product.image || fallbackImage;
    const usesGeneratedFallback = !product.image;

    return {
        ...product,
        slug: product.slug || product.id,
        categorySlug,
        oldPriceMAD: product.oldPriceMAD || null,
        promoBadge: product.promoBadge || (hasPromo ? 'Promo' : null),
        stockStatus: product.stockStatus || 'En stock',
        stock: product.stockStatus === 'Rupture de stock' ? 0 : 24,
        image,
        imageUrl: image,
        imageNeedsReview: product.imageNeedsReview ?? true,
        imageSource: product.imageSource || (usesGeneratedFallback ? 'Generated owned category fallback asset by parapharmacie.me' : 'Approved product image source pending documentation'),
        imageRightsStatus: product.imageRightsStatus || (usesGeneratedFallback ? 'owned-fallback-needs-approved-product-packshot' : 'needs-rights-review'),
        imageReplacementNote: product.imageReplacementNote || 'Replace with an owned, distributor-supplied, or brand-approved ecommerce packshot before production launch.',
        shortDescription: product.shortDescription || descriptionByCategory[product.category],
        description: product.shortDescription || descriptionByCategory[product.category],
        tags: [
            product.category,
            product.brand,
            ...(product.tags || [])
        ],
        searchKeywords: [
            product.name,
            product.brand,
            product.category,
            ...(product.tags || []),
            ...commonSearchKeywords
        ],
        cityKeywords: [...localCityKeywords],
        price: product.oldPriceMAD || product.priceMAD,
        promoPrice: hasPromo ? product.priceMAD : null,
        badge: product.promoBadge || (hasPromo ? 'Promo' : product.featured ? 'Selection Tawfiq' : null),
        rating: Number((4.6 + ratingSeed).toFixed(1)),
        reviews
    };
}

export const catalogProducts = rawProducts.map(createProduct);
