# Google Merchant Center readiness — parapharmacie.me

Audit local du 18 juillet 2026. Aucun flux Merchant Center n’est généré ni soumis par ce dépôt. Cette page décrit uniquement l’état vérifié du catalogue.

## Décision actuelle

**Le catalogue n’est pas prêt pour Merchant Center.** Les 93 références ont toutes un prix public nul faute de preuve propriétaire courante, aucun stock courant, aucun EAN/GTIN renseigné, aucune éligibilité de livraison confirmée par produit et aucun packshot réel approuvé. Les pages produit restent utiles pour identifier les références, mais elles ne doivent pas être exportées comme offres commerciales.

## État vérifié

| Exigence | État | Comportement sûr |
|---|---|---|
| URL canonique stable | Prête | Une URL `/produits/<slug>/` par référence |
| Titre, marque, description | Partiel | Présents, à relire contre l’emballage exact avant un flux |
| Prix + MAD | Bloquant | Les 93 `priceMAD` publics sont `null`; aucun `Offer` sans prix positif, source propriétaire traçable et `priceVerifiedAt` non futur de moins de 30 jours |
| Disponibilité | Bloquant | Aucun stock vérifié depuis moins de 24 heures; aucune `availability` n’est émise |
| GTIN/EAN | Bloquant | Les champs existent dans le code, mais les 93 valeurs catalogue sont `null`; ne jamais déduire un code |
| SKU marchand | Bloquant | Les 93 valeurs restent `null`; un identifiant de route ou slug n’est pas transformé en SKU |
| Image produit | Bloquant | Les 93 références utilisent un visuel de catégorie marqué `imageNeedsReview: true`, pas un packshot de la variante |
| Livraison produit | Bloquant | `deliveryEligible` reste `null` sans règle propriétaire par référence |
| Retours | Bloquant | La page retours reste `noindex` tant que ses paramètres ne sont pas confirmés |
| Frais de livraison | Partiel | 15 MAD à Khouribga et 35 MAD dans les autres villes marocaines effectivement desservies; liste exacte, délais et exclusions restent à confirmer |
| Contact | Partiel | Téléphone et WhatsApp sont publiés; aucune adresse e-mail non vérifiée n’est annoncée |
| Données structurées | Prudentes | `Product` et `Brand` sont présents; `Offer`, `availability` et `gtin` restent conditionnels aux preuves correspondantes |

Une ancienne page concurrente dans `sourceUrl` documente seulement la provenance historique du nom de catalogue. Elle ne peut jamais servir de `priceSource`.

## Preuves acceptées avant une future offre

- `priceSource` doit utiliser une référence propriétaire consultable commençant par `erp:`, `caisse:`, `facture:`, `fournisseur:` ou `catalogue-interne:`.
- `priceVerifiedAt` doit être une date ISO non future datant de 30 jours ou moins.
- `stockVerified` doit être explicitement `true`, avec une quantité finie et un `stockVerifiedAt` non futur datant de 24 heures ou moins.
- L’EAN doit être lu sur l’emballage exact, vérifié deux fois et passer le contrôle de longueur et de clé GTIN.
- Le visuel doit représenter la variante exacte et avoir des droits ecommerce documentés.
- L’éligibilité livraison doit être décidée explicitement; `null` ne signifie pas « oui ».

Le workflow propriétaire détaillé se trouve dans [PRODUCT_DATA_COMPLETION.md](PRODUCT_DATA_COMPLETION.md).

## Checklist avant toute génération de flux

1. Compléter et faire relire les preuves produit par produit.
2. Exclure automatiquement toute référence à laquelle manque un attribut obligatoire.
3. Confirmer les zones, délais, exclusions, retours et frais dans Merchant Center.
4. Revoir chaque catégorie santé, paramédical et complément alimentaire contre les règles Google en vigueur au Maroc.
5. Exécuter `npm run validate:catalog`, `npm run validate:commerce`, `npm run build` et `npm run validate:seo`.
6. Inspecter le flux produit par produit avant toute soumission; ne jamais utiliser `identifier_exists: false` comme raccourci sans preuve.
