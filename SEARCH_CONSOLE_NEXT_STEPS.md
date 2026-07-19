# Search Console et préparation aux moteurs de recherche assistés par IA

Audit local et public en lecture seule du 18 juillet 2026. Aucun compte Search Console ou service tiers n’a été ouvert ou modifié. L’indexation et la visibilité ne sont jamais garanties.

## État technique constaté

| Contrôle | Résultat local | Contrôle public au 18 juillet 2026 | Conclusion/action |
|---|---|---|---|
| `robots.txt` | `User-agent: *`, `Allow: /`, sitemap HTTPS | Même contenu public | Les pages publiques ne sont pas bloquées |
| OAI-SearchBot | Aucun groupe `Disallow: /`; garde-fou dans `validate:seo` | Requête avec user-agent `OAI-SearchBot` : HTTP 200 sur l’accueil | Aucun blocage accidentel constaté; continuer à surveiller CDN/WAF |
| Sitemap | Build local : **134** URL canoniques et indexables | Sitemap public : **123** URL | Différence normale avant déploiement des commits locaux; ne resoumettre qu’après mise en production |
| Indexabilité | Pages publiques `index, follow`; parcours privés/transactionnels `noindex` | À vérifier dans Search Console après déploiement | Ne pas ajouter panier, checkout, compte, admin, redirections ou brouillons au sitemap |
| Texte accessible | Produits, catégories, page locale et articles sont pré-rendus dans le HTML | Accueil public accessible en HTML | Les informations essentielles ne dépendent pas d’une interaction JavaScript |
| Entité | Nom, téléphone, adresse, horaires, carte et profils centralisés dans [`js/business-config.js`](js/business-config.js) | Comparer manuellement à Google/annuaires | Corriger les sources contrôlées en cas d’écart, sans créer de doublon |
| Données structurées | `Organization`, `Pharmacy`, `WebSite`, `Product`, `Offer`, `Brand`, `BlogPosting`, `BreadcrumbList` et `FAQPage` selon la page | Test Search Console/Rich Results après déploiement | Les valeurs visibles et JSON-LD sont validées localement; ne pas ajouter avis ou stock non vérifiés |
| Liens internes | Contrôle automatique des liens brisés et pages orphelines | Explorer un échantillon dans le rendu Google | Navigation accueil → catégories → produits → Conseils → Khouribga |
| Consolidation HTTPS | Redirections forcées HTTP et `www` vers l’apex HTTPS | HTTP et HTTPS `www` répondent 301 vers `https://parapharmacie.me/` | Surveiller le rapport HTTPS et les canoniques choisies |

Le fichier `robots.txt` actuel autorise déjà `OAI-SearchBot` via la règle générique. Une règle spécifique redondante n’est pas nécessaire. Selon la [FAQ officielle OpenAI pour les éditeurs](https://help.openai.com/fr-fr/articles/12627856-%C3%A9diteurs-et-d%C3%A9veloppeurs-faq), ne pas bloquer `OAI-SearchBot` permet à OpenAI d’accéder au contenu public, mais cela ne garantit aucune citation, inclusion ou visibilité.

## 1. Propriété Search Console

- [ ] Vérifier si une propriété de domaine `parapharmacie.me` existe déjà avant d’en créer une autre.
- [ ] Si le propriétaire maîtrise le DNS, préférer une propriété **Domaine** pour agréger HTTP/HTTPS et sous-domaines; suivre uniquement la méthode de vérification fournie par Google.
- [ ] À défaut, ajouter la propriété préfixe exacte **`https://parapharmacie.me/`**. Ne pas utiliser `http://` ou `https://www.` comme propriété opérationnelle principale.
- [ ] Conserver les accès avec le principe du moindre privilège; supprimer les anciens utilisateurs inconnus après vérification du propriétaire.
- [ ] Ne jamais placer un jeton, fichier de vérification privé ou capture de compte dans ce dépôt.

## 2. Déploiement avant soumission

Les commits locaux ne sont pas encore sur le site public. Avant toute demande d’indexation :

1. Attendre une mise en production approuvée et réussie.
2. Vérifier publiquement les codes HTTP de l’accueil, du sitemap, de la page Khouribga, d’un article, d’une catégorie et d’un produit.
3. Confirmer que le sitemap public contient alors les **134** URL attendues par le build de cette branche, ou le nombre produit par le build final s’il change lors de Task 6.
4. Confirmer qu’aucune URL du sitemap ne comporte `http://`, `www`, paramètre, panier, checkout, compte ou page `noindex`.

Ne pas soumettre aujourd’hui un sitemap local non déployé : Search Console ne peut lire que `https://parapharmacie.me/sitemap.xml` public.

## 3. Soumission du sitemap

- [ ] Ouvrir **Indexation → Sitemaps** dans la propriété HTTPS correcte.
- [ ] Soumettre une seule fois `https://parapharmacie.me/sitemap.xml` ou saisir `sitemap.xml` dans le champ prévu.
- [ ] Vérifier le statut **Réussite**, la date de dernière lecture et le nombre d’URL découvertes. L’[aide officielle Sitemaps](https://support.google.com/webmasters/answer/7451001?hl=fr) précise que ce rapport sert aussi à suivre les erreurs de lecture.
- [ ] Ne pas soumettre les anciennes URL `product.html?id=...`, `shop.html?category=...` ou les pages de compte.
- [ ] Ne pas supprimer/resoumettre chaque semaine sans erreur réelle; surveiller la dernière lecture et les écarts.

## 4. Inspection des URL prioritaires

Après déploiement, inspecter dans cet ordre :

1. `https://parapharmacie.me/`
2. `https://parapharmacie.me/parapharmacie-khouribga/`
3. `https://parapharmacie.me/boutique/`
4. `https://parapharmacie.me/protection-solaire/`
5. `https://parapharmacie.me/conseils/`
6. `https://parapharmacie.me/conseils/parapharmacie-en-ligne-livraison-maroc/`
7. Une fiche produit stable, par exemple `https://parapharmacie.me/produits/avene-cleanance-gel-400/`

Pour chaque URL :

- [ ] Saisir l’URL complète dans l’outil Inspection.
- [ ] Lire d’abord l’état indexé, sa date d’exploration et la raison exacte en cas d’exclusion.
- [ ] Vérifier **Exploration autorisée : Oui**, **Indexation autorisée : Oui**, réponse HTTP réussie, canonique déclarée et canonique choisie.
- [ ] Lancer **Tester l’URL publiée**, puis ouvrir le HTML/rendu testé pour confirmer que le H1, le texte principal, les liens et le JSON-LD sont accessibles.
- [ ] Cliquer **Demander une indexation** seulement si la page est nouvelle ou substantiellement mise à jour et que le test direct est valide.

Google précise que le test direct et une demande d’indexation ne garantissent pas l’indexation; voir l’[aide Inspection d’URL](https://support.google.com/webmasters/answer/9012289?hl=fr).

## 5. Rapport d’indexation

- [ ] Dans **Indexation des pages**, filtrer si possible par sitemap soumis.
- [ ] Exporter les motifs et traiter les groupes, pas seulement une URL isolée.
- [ ] États intentionnels : redirections historiques, pages `noindex` de panier/checkout/compte/admin, 404 réelles.
- [ ] États à examiner : « Explorée, actuellement non indexée », « Détectée, actuellement non indexée », canonique différente, erreur serveur, soft 404 ou blocage robots inattendu.
- [ ] Pour une canonique différente, comparer contenu, liens internes, sitemap et redirections avant de demander une nouvelle exploration.
- [ ] Ne jamais retirer `noindex` d’un parcours privé pour augmenter artificiellement le nombre de pages indexées.

## 6. Rapport HTTPS et anciennes URL

- [ ] Ouvrir **Expérience → HTTPS** et viser zéro URL HTTP indexée. Google décrit les causes et contrôles dans le [rapport HTTPS officiel](https://support.google.com/webmasters/answer/11396518?hl=fr).
- [ ] Inspecter un exemple `http://parapharmacie.me/` et `https://www.parapharmacie.me/` uniquement pour confirmer la redirection vers l’apex HTTPS.
- [ ] Surveiller les anciennes URL à paramètres. Elles doivent être redirigées vers une page canonique connue ou retourner une vraie 404, jamais servir un doublon indexable.
- [ ] Ne pas utiliser l’outil de suppression pour remplacer une redirection ou une canonique correcte.

## 7. Données structurées et contenu visible

- [ ] Contrôler les rapports d’améliorations disponibles et tester un produit, un article et la page locale.
- [ ] Comparer systématiquement le nom, l’état du prix (« vérifié » ou « à confirmer »), la marque, l’auteur et les dates visibles avec le JSON-LD.
- [ ] Ne pas corriger un avertissement facultatif en inventant avis, note, stock, GTIN, image réelle, prix valide jusqu’à une date ou qualifications éditoriales.
- [ ] Suivre [`PRODUCT_DATA_COMPLETION.md`](PRODUCT_DATA_COMPLETION.md) avant d’enrichir `Product`.
- [ ] Pour une erreur après déploiement, corriger d’abord le code/source, déployer, tester l’URL publiée, puis utiliser **Valider la correction**.

## 8. Mesure utile

- [ ] Dans **Performances**, comparer périodes et segments par page, requête, pays et appareil; annoter les dates de déploiement hors de Search Console.
- [ ] Suivre séparément l’accueil, Khouribga, catégories, produits et Conseils. Une hausse d’impressions sans clic ou action utile n’est pas une réussite commerciale complète.
- [ ] Examiner les requêtes locales et de marque pour détecter des incohérences d’entité, pas pour ajouter des mots-clés au nom Google Business Profile.
- [ ] Évaluer les pages sur plusieurs semaines; ne pas promettre un délai ou un classement.

## 9. Préparation aux recherches assistées par IA

La visibilité dans ChatGPT, Google AI Overviews, Gemini ou tout autre système dépend de décisions propres à chaque plateforme. Elle peut être influencée par l’indexabilité, un contenu utile et accessible, une entité cohérente, des sources fiables, des données structurées exactes et des mentions externes crédibles. Aucun de ces éléments ne garantit l’inclusion ni le classement.

Actions sûres :

- [ ] Maintenir des pages publiques accessibles sans connexion, CAPTCHA ou défi JavaScript obligatoire.
- [ ] Garder `robots.txt` lisible et surveiller toute nouvelle règle ciblant `OAI-SearchBot`, Googlebot ou les ressources CSS/JS essentielles.
- [ ] Vérifier les journaux CDN/Netlify avant de conclure à un blocage : code HTTP, user-agent, chemin et éventuelle règle WAF.
- [ ] Conserver nom, adresse, téléphone, carte, horaires et profils sociaux cohérents sur le site et les sources contrôlées.
- [ ] Publier des réponses originales, sourcées et révisables; afficher les dates, auteur éditorial honnête et corrections.
- [ ] Développer uniquement les mentions externes méritées décrites dans [`BACKLINK_OUTREACH_MOROCCO.md`](BACKLINK_OUTREACH_MOROCCO.md).
- [ ] Ne pas créer de page « pour ChatGPT », texte caché, faux Q/R, fausse citation, schema non visible ou fichier spécial prétendant forcer l’inclusion.

## 10. Cadence de surveillance

| Fréquence | Contrôle |
|---|---|
| Après déploiement | Codes HTTP, robots, sitemap, canoniques, URL Inspection et rendu des pages prioritaires |
| Hebdomadaire pendant un mois | Lecture sitemap, erreurs serveur, pages exclues nouvelles, actions manuelles et sécurité |
| Mensuelle | Performances par type de page, HTTPS, données structurées et incohérences de canonique |
| Trimestrielle | Cohérence d’entité, backlinks acquis, règles robots/WAF et liste des utilisateurs Search Console |

## Commandes locales avant chaque publication

```bash
npm run validate:docs
npm run lint
npm run validate:catalog
npm run validate:commerce
npm run build
npm run validate:seo
```

Le build et `validate:seo` sont la référence locale; Search Console et les tests HTTP publics sont la preuve après déploiement.
