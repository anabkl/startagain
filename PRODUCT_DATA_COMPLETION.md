# Complétion responsable des données produit

Audit local du 17 juillet 2026, fondé sur les 93 entrées normalisées de [`js/catalog-data.js`](js/catalog-data.js) et les garde-fous de [`js/product-schema.js`](js/product-schema.js). Ce document ne transforme aucune donnée indicative en donnée vérifiée.

## Résultat exact de l’audit

| Champ demandé | État des 93 produits | Manquants | Interprétation sûre |
|---|---:|---:|---|
| Stock vérifié | Aucun produit n’a `stockVerified: true` avec quantité et date | **93** | Afficher « Disponibilité à confirmer »; ne pas émettre `InStock`/`OutOfStock` |
| EAN/GTIN | Aucun `ean` vérifié | **93** | Ne pas générer un code depuis le nom, l’URL ou le SKU |
| SKU | Chaque produit utilise son identifiant catalogue comme SKU marchand | **0** | Le SKU interne est valide; ne le remplacer que si le propriétaire possède un référentiel marchand stable |
| Prix courant vérifié | Aucun `priceVerifiedAt` | **93** | `priceMAD` reste un prix catalogue indicatif; confirmer avant commande |
| Image produit réelle approuvée | Tous utilisent un fallback détenu par le site et restent `imageNeedsReview: true` | **93** | Le fallback est utilisable, mais ce n’est pas le packshot réel de la variante |
| Taille/format | 73 noms permettent une extraction; 20 restent sans format structuré | **20** | Conserver `null` jusqu’à lecture d’un emballage ou document officiel exact |
| Marque | Chaque entrée contient une marque | **0** | Champ présent; vérifier l’orthographe lors de la revue fabricant |
| Éligibilité livraison vérifiée par produit | La valeur technique par défaut est `true`, sans preuve individuelle ni date | **93** | Confirmer les restrictions réelles avant d’en faire une promesse publique |

Les cinq lacunes universelles — stock, EAN/GTIN, prix actuel, packshot réel et éligibilité livraison documentée — s’appliquent donc à **chaque identifiant produit du catalogue**, sans exception. Le SKU et la marque ne sont pas manquants.

## Les 20 produits sans taille ou format structuré

| Identifiant catalogue | Nom actuel | Donnée à obtenir |
|---|---|---|
| `forte-pharma-acerola-vitamine-c-b20` | FORTÉ PHARMA Acérola Vitamine C B20 Effervescents | Nombre exact d’unités et libellé fabricant |
| `dodie-sucette-anatomique-18m-duo-girly` | DODIE Sucette Anatomique A71 +18m Duo Girly | Nombre de sucettes et tranche d’âge telle qu’imprimée |
| `dodie-porte-biberon-isotherme` | DODIE Porte Biberon Isotherme | Capacité ou compatibilité officielle, si applicable |
| `gum-gratte-langue-double-action` | GUM Gratte-Langue Double Action | Nombre d’unités |
| `gum-kit-voyage-ref-156` | GUM Kit de Voyage Ref 156 | Contenu exact du kit |
| `gum-dentifrice-menthe-promotion` | GUM Dentifrice Menthe | Volume ou poids net |
| `vitis-gingival-dentifrice-promotion` | Vitis Gingival Dentifrice | Volume ou poids net |
| `accu-chek-instant-bandelettes-x50` | Accu-Chek Instant Bandelettes x50 | Formaliser `50 bandelettes` après vérification de la boîte |
| `releveur-de-pied-4731hd` | Releveur de Pied 4731HD | Taille, côté et référence fabricant exacts |
| `test-de-grossesse` | Test de Grossesse | Nombre de tests et référence/marque exacts |
| `tensiometre-electronique-brassard-767s` | Tensiomètre Électronique à Brassard 767S | Taille de brassard et contenu de boîte |
| `thuasne-ceinture-soutien-lombaire-361` | THUASNE Ceinture de Soutien Lombaire 361 | Taille, coloris et référence complète |
| `nuxe-coffret-prodigieux-glow-en-rose` | NUXE Coffret Prodigieux Glow en Rose | Liste et formats exacts des éléments du coffret |
| `nuxe-coffret-nuxuriance-ultra-routine-anti-age` | NUXE Coffret Nuxuriance Ultra Routine Anti-Âge Global | Liste et formats exacts des éléments du coffret |
| `nuxe-coffret-fragrance-iconique` | NUXE Coffret Fragrance Iconique | Liste et formats exacts des éléments du coffret |
| `caudalie-coffret-solution-fermete` | CAUDALIE Coffret La Solution Fermeté | Liste et formats exacts des éléments du coffret |
| `caudalie-coffret-premier-cru-yeux` | CAUDALIE Coffret Premier Cru Yeux | Liste et formats exacts des éléments du coffret |
| `eucerin-ecran-anti-pigment-promotion` | EUCERIN Écran Anti-Pigment | Variante et volume exacts; le nom actuel est insuffisant |
| `baby-nooz-seringue-nasale-promotion` | Baby Nooz Seringue Nasale | Nombre d’unités, modèle et âge éventuel |
| `perfectil-triple-action` | Perfectil Triple Action | Nombre de comprimés/gélules et variante exacte |

Pour les coffrets, ne concaténer aucun format vu sur une autre édition : le contenu peut varier selon la campagne et le marché.

## Fiche de preuve à compléter pour chaque produit

| Champ | Valeur attendue | Preuve acceptable | Champ catalogue cible |
|---|---|---|---|
| Identifiant interne | ID existant stable | Catalogue interne | `id` / `sku` |
| Nom et variante | Texte exact de la boîte destinée au Maroc | Photo réelle lisible ou fiche fabricant/distributeur autorisé | `name` |
| Marque | Orthographe officielle | Emballage ou site officiel | `brand` |
| Format | Valeur et unité exactes | Face avant/arrière de la boîte ou fiche officielle | `size` |
| EAN/GTIN | 8, 12, 13 ou 14 chiffres | Code-barres photographié et vérifié deux fois | `ean` |
| Prix actuel | MAD TTC réellement appliqué | Caisse/ERP ou facture fournisseur validée par le responsable | `priceMAD` |
| Source/date du prix | Origine et date ISO | Référence interne consultable | `priceSource`, `priceVerifiedAt` |
| Stock | Quantité réelle ou zéro | ERP/inventaire à l’instant de la vérification | `stock`, `stockVerified`, `stockVerifiedAt` |
| Image | Packshot de la variante exacte | Photo détenue ou fichier fourni avec droits ecommerce | `image`, `imageSource`, `imageRightsStatus`, `imageNeedsReview: false` |
| Livraison | Oui/non et éventuelle restriction | Règle propriétaire documentée pour ce produit | `deliveryEligible` et future date de vérification |

## Workflow propriétaire sans fabrication

1. **Sélectionner un petit lot.** Commencer par 10 produits réellement vendus ou fréquemment demandés, pas par les 93 en une fois.
2. **Identifier la variante.** Poser la boîte physique devant la fiche; comparer marque, nom, format et marché. Si deux variantes diffèrent, créer deux entrées seulement après avoir défini deux SKU stables.
3. **Capturer les preuves.** Photographier face, dos, code-barres et format sans données client. Archiver les preuves dans un espace privé, pas dans Git si elles contiennent des informations commerciales.
4. **Saisir deux fois l’EAN.** Une personne lit le code, une seconde le compare au code-barres. Ne jamais calculer un EAN à partir du nom.
5. **Vérifier le prix.** Relever le prix réellement applicable, sa source et la date. Une ancienne page concurrente n’est pas une preuve de prix courant.
6. **Vérifier le stock.** Utiliser l’inventaire/ERP; inscrire la quantité et l’heure. Une photo de rayon ne prouve pas le stock disponible à la vente.
7. **Vérifier les droits image.** Conserver l’autorisation du photographe, fournisseur ou fabricant. Le fichier doit représenter exactement la variante et ne doit pas être copié depuis un concurrent.
8. **Décider la livraison.** Confirmer poids, dimensions, fragilité, température, restriction réglementaire ou géographique. En cas de doute, garder « à confirmer ».
9. **Faire relire.** Une seconde personne compare chaque valeur à la preuve. Les champs santé, dispositifs médicaux ou compléments nécessitent la validation d’une personne qualifiée avant d’ajouter indications ou précautions.
10. **Modifier le catalogue.** Changer uniquement les champs prouvés, exécuter les validations, examiner la fiche générée, puis conserver la date de prochaine revue.

## Politique de fraîcheur recommandée

- **Stock :** donnée opérationnelle; synchronisation ou confirmation avant chaque commande. Une date ancienne ne doit jamais alimenter `availability`.
- **Prix :** revoir au minimum à chaque modification fournisseur et selon une cadence propriétaire définie. Si la date est dépassée, revenir à « prix à confirmer » plutôt que conserver une promesse.
- **Image, EAN, marque et format :** revoir lors d’un changement d’emballage, de marché, de variante ou de référence.
- **Livraison :** revoir lors d’un changement de transporteur, de réglementation, d’emballage ou de zone desservie.

## Ordre de priorité

1. Produits présentés sur l’accueil et pages Conseils.
2. Références réellement en stock et demandées à Khouribga.
3. Produits solaires et bébé liés aux guides publiés.
4. Matériel paramédical, dont les tailles et restrictions doivent être exactes.
5. Promotions et coffrets, à désindexer ou retirer lorsqu’ils ne sont plus actuels plutôt que maintenir une remise périmée.

## Contrôles après chaque lot

```bash
npm run validate:catalog
npm run validate:commerce
npm run build
npm run validate:seo
```

Vérifier ensuite que le `Product` JSON-LD n’émet `availability` que pour un stock courant prouvé et `gtin` que pour un code vérifié. Une donnée absente doit rester absente : compléter le catalogue ne justifie jamais de remplir les champs par déduction.
