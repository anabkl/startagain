# Rapport final Task 6A — SEO, vérité produit et commerce

Date de validation locale : **19 juillet 2026**
Branche : `seo/morocco-local-growth`
État de publication : **local uniquement; aucun push, aucune pull request et aucun déploiement réalisés dans Task 6A**.

## A. Synthèse des Tasks 1 à 5 préservées

| Task | Commit préservé | Résultat principal |
|---|---|---|
| 1 | `6335595` — `seo: centralize verified business identity and canonical URLs` | Identité, coordonnées et origine canonique centralisées |
| 2 | `bcfe48f` — `seo: add truthful Khouribga local experience and schema` | Page locale Khouribga et données structurées cohérentes |
| 3 | `bbd0c44` — `feat: strengthen product truth and mobile commerce UX` | Base catalogue/commerce mobile et garde-fous de vérité |
| 4 | `343a90a` — `content: expand Morocco SEO guidance and internal links` | Contenu Maroc et maillage interne étendus |
| 5 | `4864f87` — `docs: add local SEO outreach and search monitoring playbooks` | Playbooks manuels de SEO local, outreach, données produit et suivi |

Les cinq commits restent ancêtres de la branche. Le workflow GitHub Actions n’a pas été modifié pour contourner le blocage de facturation.

## B. Vérité métier retenue

- Marque ecommerce : **Parapharmacie.me**.
- Opérateur physique : **PHARMACIE TAWFIQ**.
- Téléphone : **05 21 13 03 39**; WhatsApp : **06 75 69 83 51**.
- Samedi : matin uniquement; dimanche : fermé.
- Paiement actif : **paiement à la livraison uniquement**. CMI et Apple Pay restent visibles, désactivés et marqués « Bientôt ».
- Livraison locale confirmée : **Khouribga, 15 MAD**. Aucune commune voisine n’est classée automatiquement dans cette zone.
- Autres villes marocaines plausibles : tarif configuré de **35 MAD**, avec destination et service explicitement à confirmer.
- Les 93 références n’ont actuellement ni prix courant prouvé, ni stock courant prouvé, ni EAN/GTIN, ni SKU marchand prouvé, ni packshot de variante approuvé, ni éligibilité livraison produit confirmée.

## C. Défauts découverts pendant Task 6A

1. L’API `POST /orders` pouvait accepter un mode de paiement arbitraire et calculer une commande à partir de données catalogue sans contrôler la fraîcheur des preuves.
2. Les valeurs navigateur pouvaient donner l’impression d’être la source du prix, des frais et du total; les réponses de commande ne privilégiaient pas toujours les lignes recalculées par le serveur.
3. Les mises à jour produit partielles risquaient d’effacer des champs de preuve omis; un changement de slug pouvait aussi provoquer une recherche post-mise-à-jour incohérente.
4. Des identifiants de route étaient transformés en SKU alors qu’aucune preuve propriétaire de SKU n’existe.
5. Des montants historiques/non vérifiés et des `Offer` pouvaient réapparaître dans des surfaces publiques ou générées.
6. Sur mobile, le CTA checkout fixé au viewport recouvrait CMI, Apple Pay et leur texte. Le panier peuplé restait dans une ligne horizontale trop large à 360 px, masquée par `overflow-x: hidden`.
7. Le menu mobile fermé laissait ses liens dans le parcours d’interaction.
8. Nginx montait le dépôt entier, transformait les routes inconnues en accueil, et appliquait 30 jours `immutable` aux JS/CSS non versionnés. Les ports MongoDB/Redis de production étaient publiés et le worker héritait d’un healthcheck HTTP d’API.
9. Des outils seed contenaient des valeurs de démonstration réalistes; des notices/outils de développement et règles Firebase étaient copiés dans `dist`.
10. L’audit npm signalait auparavant `qs` et Vite; les corrections sûres compatibles avec les plages déclarées devaient être appliquées sans `--force`.

## D. Corrections exactes

### Catalogue, pages et données structurées

- Une règle partagée exige un prix positif avec `priceSource` propriétaire et `priceVerifiedAt` non futur de 30 jours au plus.
- Une disponibilité exploitable exige `stockVerified: true`, une quantité entière et un `stockVerifiedAt` non futur de 24 heures au plus.
- La commande exige aussi `deliveryEligible: true`.
- Sans ces preuves, les cartes, fiches, panier, checkout et pages pré-rendues indiquent « Prix à confirmer » ou « Prix et disponibilité à confirmer »; aucun total payable n’est calculé.
- `Offer`, `Offer.price` et `availability` ne sont émis que lorsque toutes les preuves nécessaires sont courantes. Aucun avis, note, stock ou GTIN n’est inventé.
- L’identifiant de route reste un `id`; il n’est plus transformé en SKU. `sku` et `gtin` sont absents du JSON-LD tant qu’ils ne sont pas fournis et vérifiés.
- Les 93 valeurs de prix historiques publiques ont été neutralisées; les fallbacks image restent explicitement génériques et à remplacer.
- Les mots-clés publics ne présentent plus Oued Zem, Boujniba ou Boulanouare comme zones locales.

### Frontend commerce et accessibilité

- Le CTA mobile `.checkout-card__submit` est revenu dans le flux normal (`position: static`); le CTA du résumé desktop est caché au même breakpoint.
- Les listes du résumé ne masquent plus leur contenu en colonne unique. Les cartes paiement ont des pistes `minmax(0, 1fr)`, des espacements et des états de focus visibles.
- CMI et Apple Pay restent `disabled` avec `aria-disabled="true"`; COD est le seul radio actif et sélectionné.
- Le panier utilise une grille mobile `64px + minmax(0, 1fr)`, des noms qui reviennent naturellement à la ligne, des contrôles de quantité/suppression de 44 px et des CTA de 48 px.
- Le `overflow-x: hidden` global a été supprimé; les causes de largeur intrinsèque ont été corrigées.
- Le checkout et le panier n’affichent plus brièvement un faux total `0.00 DH`; ils restent sur « Prix à confirmer » tant qu’aucune commande calculable n’existe.
- Le menu mobile fermé reçoit `inert` et `aria-hidden="true"`; `aria-expanded` reste synchronisé et Échap ferme le menu puis rend le focus au bouton.
- Un échec API/Firebase configuré n’est plus converti en fausse commande locale réussie. Le mode local reste un mode mock explicitement choisi.

### Frontière backend `POST /orders`

- Seul `cod` est accepté; CMI, Apple Pay, carte ou toute autre valeur retournent une erreur sûre.
- Le schéma ignore les prix, sous-totaux, frais, totaux, stock et indicateurs supplémentaires envoyés par le navigateur.
- Chaque identifiant est résolu dans le catalogue serveur. Le produit doit être explicitement publié, livrable, avoir un prix courant traçable et un stock positif courant.
- Les alias d’un même produit sont agrégés avant le contrôle de quantité afin d’empêcher un contournement de stock par lignes dupliquées.
- Le serveur calcule le prix unitaire effectif, chaque sous-total, le sous-total commande, les frais et le total avec un arrondi monétaire à deux décimales.
- Khouribga reçoit 15 MAD et `delivery_service_confirmed: true`. Une autre ville nommée plausible reçoit 35 MAD avec `delivery_service_confirmed: false` et une notice de confirmation. Une ville non vérifiable est refusée.
- La réponse frontend privilégie les lignes, le sous-total, les frais et le total retournés par l’API.
- `PATCH` utilise uniquement les champs réellement fournis; les couples de preuve prix/stock restent cohérents et les champs omis sont préservés.

### Nginx, Docker, build et sécurité

- Nginx monte uniquement `./dist`, refuse les dotfiles et chemins de dépôt sensibles, et retourne une vraie 404 avec page 404 interne.
- Les routes propres générées continuent à fonctionner via leurs répertoires `index.html`; aucun fallback universel vers l’accueil ne subsiste.
- Les JS/CSS non versionnés utilisent `max-age=0, must-revalidate`; seuls les noms contenant un hash hexadécimal d’au moins huit caractères peuvent être `immutable` un an.
- Les images/polices non versionnées gardent un cache borné sans `immutable`.
- MongoDB et Redis ne publient plus de ports hôte en Compose production; les ports de développement restent locaux.
- Le healthcheck API vise `127.0.0.1` dans le conteneur. Le worker Celery a son propre ping Celery et n’hérite plus du contrôle HTTP.
- `seed.html` et `seed-products.html` sont devenus des notices locales sans script, action ou valeur commerce. Ils restent hors de `dist`, comme `setup-admin.html`, `firestore.rules` et `storage.rules`.
- Le lockfile a reçu uniquement des mises à jour compatibles avec les plages existantes; aucun `npm audit fix --force` ni migration forcée n’a été utilisé.

## E. Checkout et panier — observation avant/après

**Avant :** à 360 px, le bouton vert fixé en bas recouvrait une partie de CMI, Apple Pay et le texte explicatif. Le résumé pouvait commencer sous cette couche. Le panier peuplé forçait la colonne produit et le résumé dans une ligne horizontale étroite; `overflow-x: hidden` cachait la largeur réelle. Les liens du menu fermé restaient interactifs au clavier.

**Après :** le CTA suit Apple Pay dans l’ordre du document, puis le message de validation et le résumé commencent en dessous. Les trois cartes paiement, les badges « Bientôt », le CTA et les erreurs sont lisibles pendant le défilement. Le panier empile cartes et résumé; les noms longs se replient, tous les contrôles testés mesurent au moins 44 px, et la largeur du document égale exactement celle du viewport.

Pour tester un état peuplé alors que les 93 produits réels sont volontairement non commandables, une fixture locale synthétique `noindex` a réutilisé le DOM et le CSS de production. Elle n’a jamais été ajoutée au catalogue, n’a jamais été staged/commitée, puis a été supprimée avant le build final. L’état vide et le refus des produits non vérifiés ont été testés sur les vraies URLs.

## F. Résultats navigateur locaux

| Viewport | Routes réelles | Checkout peuplé, validation et thèmes | Panier vide/peuplé | Résultat |
|---|---|---|---|---|
| 360×800 | Accueil, boutique, catégorie, produit, panier, checkout, Khouribga | Clair et sombre; CTA statique; aucune intersection avec COD/CMI/Apple Pay/erreur; résumé entièrement atteignable par défilement; champs à 16 px | État vide réel sans faux total; fixture peuplée de 336 px, noms longs repliés, contrôles 44 px | Aucune largeur horizontale; aucun log console d’erreur |
| 390×844 | Même matrice | Clair et sombre; trois moyens visibles; CTA et résumé séparés | Cartes de 366 px; résumé sous les articles | Largeur document = 390 px; aucun chevauchement |
| 412×915 | Même matrice | Clair et sombre; résumé non tronqué; défilement utilisable | Cartes de 388 px; résumé sous les articles | Largeur document = 412 px; aucun chevauchement |

Contrôles complémentaires :

- Les JSON-LD des pages testées se parsèrent sans erreur.
- La fiche AVÈNE testée ne contient aucun montant, aucun contrôle de quantité, et son bouton commande est réellement `disabled` et `aria-disabled="true"`.
- Le menu fermé est `inert`, `aria-hidden="true"`, `aria-expanded="false"`; après Échap, le bouton retrouve un focus visible de 3 px.
- Le checkout sombre réel conserve un fond sombre, des cartes paiement lisibles, une largeur exacte de 360 px et « Prix à confirmer ».

## G. Sitemap et vérification publique en lecture seule

### Local

- Sitemap généré : **134 URL** canoniques, uniques, indexables, HTTPS apex.
- Build : **146 fichiers HTML**; 93 produits, 12 catégories, boutique, pages de confiance, 20 articles Conseils, retours, 404 et redirections.
- Brouillons, panier, checkout, succès, connexion, compte, admin, outils seed, paramètres et pages `noindex` restent hors sitemap.

### Production au 18 juillet 2026 — état antérieur au déploiement local

- `https://parapharmacie.me/` : HTTP 200.
- `http://parapharmacie.me/` et `https://www.parapharmacie.me/` : HTTP 301 vers l’apex HTTPS.
- Requête accueil avec user-agent `OAI-SearchBot` : HTTP 200.
- `robots.txt` : autorise `/` et référence le sitemap apex.
- Sitemap public : **123 URL uniques**, toutes sous `https://parapharmacie.me/`, dont 11 URL Conseils; la page Khouribga n’y figure pas encore.
- Boutique et produit échantillon : HTTP 200; page Khouribga : HTTP 404.
- Le produit AVÈNE public contient encore un `Offer.price` JSON-LD de `227.00 MAD`, sans montant visible. C’est l’ancien état déployé; le build local retire cet `Offer` faute de preuve courante.
- Le JS checkout public annonce `Cache-Control: public,max-age=86400`. Le changement Nginx local concerne le déploiement Docker et n’a pas été publié.

Ces écarts sont des preuves que les changements locaux ne sont pas encore en production, pas des échecs des validations locales.

## H. Matrice de validation locale

| Commande | Résultat |
|---|---|
| `git diff --check` | Réussi |
| `npm ci --no-audit --no-fund` | Réussi; 38 paquets installés depuis le lockfile |
| `npm run lint` | Réussi; 20 fichiers cœur et 14 routes HTML |
| `npm run validate:catalog` | Réussi; 93 produits, 12 catégories; 93 prix et 93 stocks restent non vérifiés |
| `npm run validate:commerce` | Réussi; 93 correspondances produit/API et refus fail-closed |
| `npm run validate:docs` | Réussi avant rapport sur 9 documents; à relancer avec ce rapport dans la matrice finale |
| `npm run build` | Réussi; sitemap local de 134 URL |
| `npm run validate:seo` | Réussi; 134 URL sitemap et 146 fichiers HTML |
| `npm audit --audit-level=low` | Réussi; **0 vulnérabilité** |
| `black --check app tests` | Réussi après formatage final; tous les fichiers backend/test concernés sont conformes |
| `flake8 app tests` | Réussi; aucune erreur |
| `pytest -q` | Réussi; **70 tests** |
| `pip check` | Réussi; aucune dépendance Python cassée |
| `docker compose -f docker-compose.yml config --quiet` | Réussi |
| `docker compose -f docker-compose.dev.yml config --quiet` | Réussi |

L’environnement backend isolé disponible utilise Python **3.13.13**, alors que le workflow CI cible Python 3.12. Les tests sont verts localement, mais l’exécution CI reste nécessaire après rétablissement du compte.

## I. Limites et blocages non masqués

- Le daemon Docker local répond : `Cannot connect to the Docker daemon at unix:///Users/info/.docker/run/docker.sock. Is the docker daemon running?` Les builds/runtimes conteneur et `nginx -t` dans l’image n’ont donc pas pu être exécutés. Les deux configurations Compose sont toutefois valides.
- Le précédent blocage de facturation GitHub a été signalé comme résolu par le propriétaire le 19 juillet 2026. La restauration effective de GitHub Actions doit encore être confirmée par une nouvelle exécution CI après le push de Task 6B; aucun contournement du workflow n’a été introduit.
- Les 93 références restent non commandables jusqu’à saisie des preuves. Ce comportement est intentionnel.
- La production reste sur l’ancien build jusqu’à une publication distincte et autorisée; la page Khouribga y retourne encore 404 et l’ancien `Offer.price` doit disparaître après déploiement.
- Aucun compte Google Business Profile, Search Console, réseau social, annuaire ou service tiers n’a été ouvert ou modifié.

## J. Sécurité des secrets

- `backend/.env` est ignoré par Git et n’est pas suivi. Aucune valeur de ce fichier n’est incluse dans le rapport ou le diff.
- Le diff staged doit rester limité aux fichiers explicitement revus et faire l’objet d’un scan de noms/empreintes sans imprimer de valeur.
- Le propriétaire doit **faire tourner toute valeur réelle qui aurait pu apparaître dans une sortie d’outil privée antérieure**, puis remplacer les secrets uniquement dans les gestionnaires locaux/de déploiement. Ne jamais les ajouter à Git.

## K. Actions manuelles exactes du propriétaire

1. Vérifier en Task 6B que le blocage GitHub est réellement levé en poussant la branche normalement puis en laissant GitHub Actions exécuter les jobs existants; ne pas modifier le workflow pour contourner un éventuel blocage.
2. Faire tourner les secrets potentiellement réels, mettre à jour les variables du fournisseur de déploiement et conserver `backend/.env` hors Git.
3. Compléter un premier lot de produits selon [`PRODUCT_DATA_COMPLETION.md`](PRODUCT_DATA_COMPLETION.md) : SKU marchand, EAN lu sur l’emballage, prix MAD, source propriétaire, date, stock, heure, éligibilité livraison et droits du vrai packshot.
4. Confirmer par écrit la liste exacte des villes desservies hors Khouribga, délais, exclusions et usage du tarif 35 MAD. Ne pas classer une commune proche à 15 MAD sans cette validation.
5. Relire les noms, formats, marques et contenus santé contre l’emballage/fabricant; ne publier aucune promesse médicale ou disponibilité déduite.
6. Approuver les photos réelles de façade/intérieur/produits et leurs droits avant remplacement des fallbacks.
7. Après CI verte, réaliser un déploiement contrôlé du build `dist`, de l’API et de la configuration Nginx/Compose applicable.
8. Vérifier publiquement codes HTTP, canoniques, robots, sitemap, page Khouribga, produit, catégorie, checkout et cache JS/CSS avant toute demande d’indexation.
9. Suivre la checklist manuelle dans [`MANUAL_LOCAL_SEO_CHECKLIST.md`](MANUAL_LOCAL_SEO_CHECKLIST.md); ne jamais utiliser faux avis, nom GBP enrichi de mots-clés, liens achetés ou partenariats fabriqués.

## L. Déploiement, rollback et Search Console

### Checklist de déploiement

- [ ] Facturation GitHub rétablie et CI verte sur le commit exact.
- [ ] Diff/secret scan relus; aucun `.env`, jeton, clé, dump ou fixture QA.
- [ ] `npm ci`, build, validations frontend/backend et Compose rejoués dans l’environnement de livraison.
- [ ] Daemon Docker disponible; images construites; healthchecks API, worker, MongoDB et Redis observés.
- [ ] Nginx testé : route propre 200, fichier inconnu 404, dépôt/dotfile refusé, JS/CSS mutable revalidé.
- [ ] API testée avec COD valide et refus CMI/Apple Pay/prix-stock-livraison non prouvés.
- [ ] Production testée en HTTPS apex; `www`/HTTP redirigent une seule fois.
- [ ] Sitemap public égal au sitemap du build déployé; ancien `Offer.price` absent.

### Rollback

1. Conserver l’identifiant du déploiement stable précédent et un export des variables de configuration dans le gestionnaire sécurisé du fournisseur.
2. En cas d’erreur, revenir au précédent artefact/image; ne pas restaurer une base de données ou exécuter un seed sans procédure propriétaire.
3. Purger/revalider uniquement les actifs du déploiement concerné, puis revérifier accueil, API santé, checkout, 404 et sitemap.
4. Documenter l’incident et corriger sur une nouvelle branche/commit; ne pas réécrire l’historique partagé.

### Search Console après déploiement

- **Jour 7 :** vérifier lecture du sitemap, HTTP/HTTPS, canonique choisie, page Khouribga et un produit; relever les motifs d’exclusion, sans demander en masse une indexation.
- **Jour 14 :** comparer URL découvertes/indexées, erreurs serveur, soft 404, données structurées et requêtes de marque/locales; corriger les groupes de causes.
- **Jour 28 :** comparer impressions/clics/pages, appareils et requêtes à la baseline du jour de déploiement; revoir contenu, maillage, entité et mentions externes crédibles.

La procédure détaillée reste dans [`SEARCH_CONSOLE_NEXT_STEPS.md`](SEARCH_CONSOLE_NEXT_STEPS.md).

## M. Limite de résultat

Une base technique correcte améliore l’exploration, la compréhension et la fiabilité, mais **ne garantit ni indexation, ni position, ni trafic, ni citation ou inclusion dans ChatGPT, Google AI Overviews, Gemini ou tout autre système**. La visibilité dépend aussi de la qualité utile, de la cohérence d’entité, de l’autorité, des mentions externes fiables et des décisions propres à chaque moteur.
