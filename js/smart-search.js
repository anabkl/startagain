import { normalizeSearchText } from './catalog.js';

const RECENT_SEARCHES_KEY = 'parapharmacie_recent_searches';
const MAX_RECENTS = 6;
const QUERY_EXPANSIONS = {
    acne: ['acniben', 'sebium', 'cleanance', 'imperfections'],
    boutons: ['acne', 'sebium', 'cleanance', 'imperfections'],
    solaire: ['spf', 'ecran', 'sun', 'photoprotection'],
    cheveux: ['capillaire', 'shampooing', 'forcapil', 'ongles'],
    bebe: ['baby', 'mustela', 'uriage bebe', 'maman'],
    vitamine: ['vitamin', 'acerola', 'forte pharma', 'solgar']
};

export function debounce(fn, wait = 180) {
    let timeoutId;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => fn(...args), wait);
    };
}

function tokenize(value) {
    const baseTokens = normalizeSearchText(value)
        .split(/\s+/)
        .filter((word) => word.length > 1);
    const expanded = baseTokens.flatMap((word) => QUERY_EXPANSIONS[word] || []);
    return [...new Set([...baseTokens, ...expanded.map(normalizeSearchText)])];
}

function getSearchText(product) {
    return [
        product.name,
        product.brand,
        product.category,
        product.categoryLabel,
        product.categoryArabicName,
        product.shortDescription,
        product.description,
        product.tags,
        product.keywords,
        product.searchKeywords,
        product.symptoms,
        product.cityKeywords
    ].flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean).join(' ');
}

function scoreProduct(product, query) {
    const normalizedQuery = normalizeSearchText(query);
    const tokens = tokenize(query);
    if (!tokens.length) return 1;

    const name = normalizeSearchText(product.name);
    const brand = normalizeSearchText(product.brand);
    const category = normalizeSearchText([product.category, product.categoryLabel, product.categoryArabicName].join(' '));
    const fullText = normalizeSearchText(getSearchText(product));

    let score = 0;
    if (name === normalizedQuery) score += 80;
    if (brand === normalizedQuery) score += 55;
    if (name.includes(normalizedQuery)) score += 40;
    if (brand.includes(normalizedQuery)) score += 30;
    if (category.includes(normalizedQuery)) score += 24;

    for (const token of tokens) {
        if (name.includes(token)) score += 16;
        else if (brand.includes(token)) score += 14;
        else if (category.includes(token)) score += 12;
        else if (fullText.includes(token)) score += 8;
    }

    if (score > 0 && (product.featured || product.bestseller)) score += 2;
    if (score > 0 && (product.isPromotion || product.promoPrice || product.promoBadge)) score += 1;
    return score;
}

export function searchProducts(products, query, limit = products.length) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return products.slice(0, limit);

    return products
        .map((product) => ({ product, score: scoreProduct(product, normalizedQuery) }))
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((result) => result.product);
}

export function getRecentSearches() {
    try {
        const searches = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
        return Array.isArray(searches) ? searches : [];
    } catch {
        return [];
    }
}

export function saveRecentSearch(query) {
    const value = String(query || '').trim();
    if (value.length < 2) return;
    const normalized = normalizeSearchText(value);
    const next = [
        value,
        ...getRecentSearches().filter((item) => normalizeSearchText(item) !== normalized)
    ].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export function getEmptySearchSuggestions(products) {
    const terms = ['solaire', 'acne', 'cheveux', 'bebe', 'cerave', 'avene', 'bioderma', 'vitamine c'];
    return terms.filter((term) => searchProducts(products, term, 1).length > 0).slice(0, 6);
}
