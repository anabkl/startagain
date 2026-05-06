import { isFirebaseEnabled } from './runtime-config.js';

const FALLBACK_IMAGE = 'assets/images/photopharamcie.png';

export const categories = [
    {
        slug: 'soins-visage',
        name: 'Soins visage',
        arabicName: 'العناية بالوجه',
        icon: 'fa-spa',
        color: '#eaf7f1',
        description: 'Nettoyants, hydratants, solaires et routines dermo-cosmétiques.'
    },
    {
        slug: 'produits-cosmetiques',
        name: 'Produits cosmétiques',
        arabicName: 'منتجات التجميل',
        icon: 'fa-wand-magic-sparkles',
        color: '#fff1f4',
        description: 'Sélection beauté pour peau, cheveux et hygiène quotidienne.'
    },
    {
        slug: 'complements-alimentaires',
        name: 'Compléments alimentaires',
        arabicName: 'مكملات غذائية',
        icon: 'fa-leaf',
        color: '#f7f3e8',
        description: 'Vitamines et compléments pour accompagner une routine équilibrée.'
    },
    {
        slug: 'bebe-maman',
        name: 'Bébé et maman',
        arabicName: 'الأم والطفل',
        icon: 'fa-baby',
        color: '#eef6ff',
        description: 'Soins doux, change, hydratation et essentiels famille.'
    },
    {
        slug: 'hygiene-bien-etre',
        name: 'Hygiène et bien-être',
        arabicName: 'النظافة والراحة',
        icon: 'fa-pump-soap',
        color: '#edf7f6',
        description: 'Produits pratiques pour l’hygiène, le confort et la maison.'
    }
];

export const mockProducts = [
    {
        id: 'avene-cleanance-gel-400',
        name: 'Avène Cleanance Gel Nettoyant 400ml',
        brand: 'Avène',
        category: 'Soins visage',
        categorySlug: 'soins-visage',
        price: 149,
        promoPrice: 129,
        stock: 12,
        rating: 4.8,
        reviews: 42,
        imageUrl: 'assets/images/photopharamcie.png',
        badge: 'Best seller',
        featured: true,
        bestseller: true,
        description: 'Gel nettoyant doux pour la routine quotidienne des peaux mixtes à grasses. Texture fraîche, sans promesse médicale, adapté à un usage cosmétique.'
    },
    {
        id: 'la-roche-posay-anthelios-spf50',
        name: 'La Roche-Posay Anthelios SPF50+ 50ml',
        brand: 'La Roche-Posay',
        category: 'Soins visage',
        categorySlug: 'soins-visage',
        price: 189,
        promoPrice: 169,
        stock: 18,
        rating: 4.9,
        reviews: 67,
        imageUrl: 'assets/images/logo-head.png',
        badge: 'Protection solaire',
        featured: true,
        bestseller: true,
        description: 'Fluide solaire haute protection pour accompagner les routines visage au quotidien. Convient aux achats de parapharmacie au Maroc.'
    },
    {
        id: 'cerave-creme-hydratante-340',
        name: 'CeraVe Crème Hydratante 340g',
        brand: 'CeraVe',
        category: 'Produits cosmétiques',
        categorySlug: 'produits-cosmetiques',
        price: 165,
        promoPrice: null,
        stock: 9,
        rating: 4.7,
        reviews: 31,
        imageUrl: 'assets/images/parashop tawfiq.png',
        badge: 'Routine peau',
        featured: true,
        bestseller: false,
        description: 'Crème hydratante visage et corps pour une routine cosmétique simple et confortable.'
    },
    {
        id: 'nuxe-huile-prodigieuse-100',
        name: 'Nuxe Huile Prodigieuse 100ml',
        brand: 'Nuxe',
        category: 'Produits cosmétiques',
        categorySlug: 'produits-cosmetiques',
        price: 245,
        promoPrice: 219,
        stock: 7,
        rating: 4.8,
        reviews: 24,
        imageUrl: 'assets/images/tawfiq.png',
        badge: 'Coup de coeur',
        featured: true,
        bestseller: false,
        description: 'Huile sèche multi-usages pour sublimer la peau et les cheveux dans une routine beauté.'
    },
    {
        id: 'mustela-gel-lavant-doux-500',
        name: 'Mustela Gel Lavant Doux Bébé 500ml',
        brand: 'Mustela',
        category: 'Bébé et maman',
        categorySlug: 'bebe-maman',
        price: 105,
        promoPrice: 95,
        stock: 20,
        rating: 4.9,
        reviews: 55,
        imageUrl: 'assets/images/camion livraison.png',
        badge: 'Bébé',
        featured: true,
        bestseller: true,
        description: 'Gel lavant doux pour la toilette quotidienne du bébé, avec une formulation cosmétique adaptée aux familles.'
    },
    {
        id: 'biolane-lingettes-bebe',
        name: 'Biolane Lingettes Bébé 72 unités',
        brand: 'Biolane',
        category: 'Bébé et maman',
        categorySlug: 'bebe-maman',
        price: 39,
        promoPrice: null,
        stock: 30,
        rating: 4.6,
        reviews: 18,
        imageUrl: 'assets/images/367747510_116895291500371_5553774791326389444_n.jpg',
        badge: 'Essentiel',
        featured: false,
        bestseller: false,
        description: 'Lingettes pratiques pour les routines de change et les déplacements avec bébé.'
    },
    {
        id: 'vitamine-c-zinc-30',
        name: 'Vitamine C + Zinc 30 comprimés',
        brand: 'Arkopharma',
        category: 'Compléments alimentaires',
        categorySlug: 'complements-alimentaires',
        price: 89,
        promoPrice: 79,
        stock: 15,
        rating: 4.5,
        reviews: 29,
        imageUrl: 'assets/images/logo-head.png',
        badge: 'Routine bien-être',
        featured: true,
        bestseller: true,
        description: 'Complément alimentaire pour accompagner une routine nutritionnelle équilibrée. Ne remplace pas une alimentation variée.'
    },
    {
        id: 'magnesium-b6-60',
        name: 'Magnésium B6 60 gélules',
        brand: 'Nutrisanté',
        category: 'Compléments alimentaires',
        categorySlug: 'complements-alimentaires',
        price: 119,
        promoPrice: null,
        stock: 11,
        rating: 4.4,
        reviews: 21,
        imageUrl: 'assets/images/photopharamcie.png',
        badge: 'Équilibre',
        featured: false,
        bestseller: false,
        description: 'Complément à intégrer dans une routine bien-être, selon les conseils d’un professionnel si besoin.'
    },
    {
        id: 'uriage-eau-thermale-300',
        name: 'Uriage Eau Thermale Spray 300ml',
        brand: 'Uriage',
        category: 'Hygiène et bien-être',
        categorySlug: 'hygiene-bien-etre',
        price: 75,
        promoPrice: 65,
        stock: 16,
        rating: 4.7,
        reviews: 36,
        imageUrl: 'assets/images/tawfiq.png',
        badge: 'Fraîcheur',
        featured: true,
        bestseller: false,
        description: 'Spray d’eau thermale pour rafraîchir la peau et compléter une routine de soins.'
    },
    {
        id: 'bioderma-atoderm-gel-douche',
        name: 'Bioderma Atoderm Gel Douche 1L',
        brand: 'Bioderma',
        category: 'Hygiène et bien-être',
        categorySlug: 'hygiene-bien-etre',
        price: 139,
        promoPrice: null,
        stock: 13,
        rating: 4.8,
        reviews: 40,
        imageUrl: 'assets/images/parashop tawfiq.png',
        badge: 'Format famille',
        featured: false,
        bestseller: true,
        description: 'Gel douche grand format pour l’hygiène quotidienne de toute la famille.'
    }
];

export const trustBadges = [
    { icon: 'fa-truck-fast', title: 'Livraison au Maroc', text: 'Khouribga, Casablanca, Rabat, Marrakech et autres villes.' },
    { icon: 'fa-certificate', title: 'Produits authentiques', text: 'Sélection parapharmacie auprès de marques et circuits fiables.' },
    { icon: 'fa-hand-holding-dollar', title: 'Paiement à la livraison', text: 'Cash on Delivery disponible pour commander sereinement.' },
    { icon: 'fa-headset', title: 'Conseil WhatsApp', text: 'Support humain pour confirmer disponibilité et livraison.' }
];

export const testimonials = [
    {
        name: 'Salma A.',
        location: 'Khouribga',
        text: 'Commande confirmée rapidement sur WhatsApp. Le site donne confiance et les prix sont clairs.'
    },
    {
        name: 'Youssef B.',
        location: 'Casablanca',
        text: 'J’ai trouvé facilement mes soins visage et le paiement à la livraison m’a rassuré.'
    },
    {
        name: 'Nadia R.',
        location: 'Béni Mellal',
        text: 'Belle sélection bébé et maman, avec des descriptions simples sans exagération.'
    }
];

export const faqs = [
    {
        question: 'Est-ce que parapharmacie.me livre partout au Maroc ?',
        answer: 'La boutique est pensée pour la livraison au Maroc. Les délais et frais exacts sont confirmés par WhatsApp selon la ville.'
    },
    {
        question: 'Puis-je payer à la livraison ?',
        answer: 'Oui. Le paiement à la livraison est l’option principale pour les commandes locales et nationales.'
    },
    {
        question: 'Les produits sont-ils authentiques ?',
        answer: 'La sélection met en avant des produits de parapharmacie et marques reconnues. La disponibilité est confirmée avant expédition.'
    },
    {
        question: 'Puis-je commander directement sur WhatsApp ?',
        answer: 'Oui. Le panier et la fiche produit proposent une action WhatsApp pour finaliser ou poser une question.'
    }
];

export function getProductImage(product) {
    return product?.imageUrl || FALLBACK_IMAGE;
}

export function getEffectivePrice(product) {
    const promo = Number(product?.promoPrice || 0);
    const price = Number(product?.price || 0);
    return promo > 0 && promo < price ? promo : price;
}

export function normalizeSearchText(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '');
}

export function matchesProduct(product, query) {
    const search = normalizeSearchText(query);
    if (!search) return true;

    const haystack = normalizeSearchText([
        product.name,
        product.brand,
        product.category,
        product.description,
        ...(product.tags || [])
    ].join(' '));

    return search.split(/\s+/).every((word) => haystack.includes(word));
}

export function matchesCategory(product, categorySlug) {
    return categorySlug === 'all' || product.categorySlug === categorySlug || product.category === categorySlug;
}

async function loadFirebaseProducts() {
    const [{ db }, firestore] = await Promise.all([
        import('./firebase.js'),
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js')
    ]);
    const snap = await firestore.getDocs(firestore.collection(db, 'products'));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

function withTimeout(promise, timeoutMs = 3000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('Firebase catalog timeout')), timeoutMs);
        })
    ]);
}

export async function getCatalogProducts() {
    if (!isFirebaseEnabled()) {
        return { products: mockProducts, source: 'mock' };
    }

    try {
        const firebaseProducts = await withTimeout(loadFirebaseProducts());
        const publicProducts = firebaseProducts.filter((product) => product.type !== 'pack');

        if (publicProducts.length > 0) {
            return { products: publicProducts, source: 'firebase' };
        }
    } catch (error) {
        console.info('Using local demo catalog:', error?.message || error);
    }

    return { products: mockProducts, source: 'mock' };
}

export async function getCatalogProduct(id) {
    const { products, source } = await getCatalogProducts();
    return {
        product: products.find((item) => item.id === id) || null,
        products,
        source
    };
}
