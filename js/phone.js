export function normalizeMoroccanPhone(phone) {
    const original = String(phone || '').trim();
    const compact = original.replace(/[\s().-]/g, '');

    if (/^0[67]\d{8}$/.test(compact)) {
        return { original, normalized: `+212${compact.slice(1)}`, isValid: true };
    }

    if (/^\+212[67]\d{8}$/.test(compact)) {
        return { original, normalized: compact, isValid: true };
    }

    if (/^212[67]\d{8}$/.test(compact)) {
        return { original, normalized: `+${compact}`, isValid: true };
    }

    return { original, normalized: '', isValid: false };
}
