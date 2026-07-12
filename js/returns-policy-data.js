// Central, maintainable source of truth for the returns/refund policy.
//
// No approved returns policy exists yet anywhere in this repo or on the
// live site (verified by search before creating this file). Every business
// fact below is therefore left unconfirmed on purpose. DO NOT set
// `confirmed: true` or fill in a `value` unless the pharmacy owner has
// explicitly approved that exact wording — this file is the single place
// that gate flips, and it drives both the page content and whether the
// page is indexed / added to the sitemap (see scripts/generate-seo-pages.mjs
// buildReturnsPage() and js/seo-routes.js RETURNS_ROUTE).

function unconfirmedField(note) {
    return { confirmed: false, value: null, note };
}

export const returnsPolicy = {
    lastReviewedDate: '2026-07-12',
    acceptedReturnTypes: unconfirmedField('À confirmer par le gérant : quels types de retour sont acceptés (produit défectueux uniquement, erreur de commande, non-conformité, ou retour de confort) ?'),
    returnWindowDays: unconfirmedField('À confirmer par le gérant : délai en jours pendant lequel un retour peut être demandé après réception.'),
    unopenedNonDefectiveAccepted: unconfirmedField('À confirmer par le gérant : les produits non ouverts et non défectueux peuvent-ils être retournés pour convenance ?'),
    openedHygieneCosmeticPolicy: unconfirmedField('À confirmer par le gérant : politique spécifique pour les produits d’hygiène ou cosmétiques déjà ouverts (souvent exclus du retour pour raisons sanitaires — à valider explicitement).'),
    exchangesAllowed: unconfirmedField('À confirmer par le gérant : les échanges (contre un autre produit ou une autre référence) sont-ils proposés ?'),
    returnShippingFeePolicy: unconfirmedField('À confirmer par le gérant : qui prend en charge les frais de retour (client ou pharmacie) et dans quels cas ?'),
    refundMethod: unconfirmedField('À confirmer par le gérant : mode de remboursement (espèces à la livraison inversée, virement, avoir) selon le mode de paiement d’origine.'),
    refundProcessingTime: unconfirmedField('À confirmer par le gérant : délai de traitement du remboursement une fois le retour reçu et validé.')
};

export function isReturnsPolicyPublishReady() {
    return Object.values(returnsPolicy).every((field) => (
        typeof field !== 'object' || field === null || field.confirmed === true
    ));
}
