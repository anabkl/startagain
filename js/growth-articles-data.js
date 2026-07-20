// Task 4 additions. Product IDs are resolved against js/catalog-data.js by
// validate-seo.mjs; no price is quoted because the catalogue has no current
// priceVerifiedAt values for these references.

const AUTHOR = 'Équipe Parapharmacie.me';
const DATE = '2026-07-17';
const WHO_UV = { label: 'OMS — Rayonnement ultraviolet (fiche d’information)', url: 'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation' };
const FDA_SUN = { label: 'FDA — Conseils officiels sur la protection solaire', url: 'https://www.fda.gov/consumers/consumer-updates/tips-stay-safe-sun-sunscreen-sunglasses' };
const AAD_ACNE = { label: 'American Academy of Dermatology — Conseils de soin en cas d’acné', url: 'https://www.aad.org/public/diseases/acne/skin-care/tips' };
const NHS_BABY = { label: 'NHS — Donner le bain à son bébé', url: 'https://www.nhs.uk/best-start-in-life/baby/baby-basics/caring-for-your-baby/bathing-your-baby/' };
const AVENE_CLEANANCE = { label: 'Eau Thermale Avène — Cleanance Gel nettoyant (page officielle)', url: 'https://www.eau-thermale-avene.fr/p/cleanance-gel-nettoyant-3282770139204-14c39aab' };
const BIODERMA_SENSIBIO = { label: 'Bioderma — Créaline/Sensibio Gel moussant (page officielle France)', url: 'https://www.bioderma.fr/p/crealine-gel-moussant' };
const DELIVERY_SOURCE = { label: 'Parapharmacie.me — modalités de livraison publiées', url: '/livraison/' };
const CONTACT_SOURCE = { label: 'Parapharmacie.me — coordonnées de Pharmacie Tawfiq', url: '/contact/' };

const solarProducts = [
    'centaurea-creme-solaire-invisible-spf50-125',
    'photowhite-creme-solaire-spf50-invisible-50',
    'uriage-bariesun-fluide-ultra-leger-spf50-30',
    'dermagor-creme-solaire-teintee-spf50-100'
];
const cleananceProducts = [
    'avene-cleanance-gel-400',
    'avene-cleanance-gel-nettoyant-200',
    'avene-cleanance-hydra-creme-lavante-200'
];
const sensibioProducts = [
    'bioderma-sensibio-gel-moussant-200',
    'bioderma-sensibio-h2o-ar-250',
    'bioderma-sensibio-defensive-creme-40',
    'bioderma-sensibio-defensive-riche-40'
];
const babyProducts = [
    'mustela-gel-2en1-bebe-200',
    'mustela-gel-lavant-doux-500',
    'uriage-bebe-premiere-creme-lavante-500',
    'dodie-lait-toilette-3en1-500'
];

function article(data) {
    return {
        status: 'published',
        heroImage: `/assets/products/category-fallback-${data.categorySlug}.webp`,
        publishedDate: DATE,
        updatedDate: DATE,
        readingTimeMinutes: 6,
        author: AUTHOR,
        faq: [],
        ...data
    };
}

export const growthArticles = [
    article({
        slug: 'meilleure-creme-solaire-spf-50-maroc',
        title: 'Meilleure crème solaire SPF 50 au Maroc : comment choisir sans faux classement',
        description: 'Comparez les crèmes solaires SPF 50 du catalogue selon des critères utiles, sans classement ni promesse non vérifiée.',
        directAnswer: 'Il n’existe pas une crème solaire SPF 50 universellement « meilleure ». Au Maroc, vérifiez surtout la protection à large spectre, le format, l’usage visage ou corps, la résistance à l’eau indiquée et la texture que vous appliquerez correctement.',
        category: 'Protection solaire', categorySlug: 'solaire',
        sections: [
            { heading: 'La bonne réponse à une recherche de « meilleure » crème', body: 'Un palmarès unique serait trompeur : la bonne référence dépend de la zone d’application, du contexte d’exposition et des mentions réellement présentes sur l’emballage. Commencez par les critères de notre <a href="/conseils/comment-choisir-creme-solaire-maroc/">guide de choix solaire</a>, puis comparez les formats disponibles.' },
            { heading: 'Vérifier le niveau et l’étendue de la protection', body: 'Le SPF concerne principalement les UVB. Recherchez aussi une mention de protection à large spectre ou l’indication UVA sur l’étiquette. Aucun écran solaire ne bloque tous les UV : ombre, vêtements et limitation de l’exposition restent complémentaires.' },
            { heading: 'Choisir un format adapté à l’usage réel', body: 'Un petit fluide peut être pratique pour le visage et les retouches, tandis qu’un format plus généreux facilite l’application sur le corps. Les pages catalogue indiquent uniquement le nom, le format et la catégorie vérifiables ; consultez toujours l’emballage avant usage.' },
            { heading: 'Comparer des références réellement présentes au catalogue', body: 'La catégorie <a href="/protection-solaire/">protection solaire</a> rassemble notamment des fluides, crèmes invisibles et textures teintées. Ces catégories d’usage ne constituent ni une recommandation médicale ni une validation des allégations figurant dans le nom commercial.' },
            { heading: 'Confirmer avant de commander', body: 'Le stock et le prix final ne sont pas vérifiés en temps réel. Ouvrez la fiche qui vous intéresse puis utilisez le contact WhatsApp pour confirmer la référence, son prix et sa disponibilité, notamment pour une livraison à <a href="/parapharmacie-khouribga/">Khouribga</a>.' }
        ], sources: [WHO_UV, FDA_SUN], relatedProductSlugs: solarProducts,
        relatedArticleSlugs: ['comment-choisir-creme-solaire-maroc', 'difference-spf-30-spf-50', 'creme-solaire-maroc-prix'],
        relatedLinks: [{ href: '/parapharmacie-khouribga/', label: 'Voir le service local à Khouribga' }]
    }),
    article({
        slug: 'creme-solaire-maroc-prix',
        title: 'Crème solaire au Maroc : comprendre les prix avant d’acheter',
        description: 'Formats, textures et vérification du prix : une méthode transparente pour comparer une crème solaire au Maroc.',
        directAnswer: 'Pour comparer le prix d’une crème solaire au Maroc, rapportez toujours le montant au format exact et vérifiez qu’il s’agit de la même variante. Sans preuve propriétaire datée de moins de 30 jours, Parapharmacie.me ne publie aucun montant et demande une confirmation avant commande.',
        category: 'Protection solaire', categorySlug: 'solaire',
        sections: [
            { heading: 'Pourquoi aucun prix exact n’est publié dans ce guide', body: 'Un prix sans date de vérification peut induire en erreur. Ce guide ne reprend donc aucun montant : les fiches indiquent « Prix à confirmer » en l’absence de preuve courante.' },
            { heading: 'Comparer le même produit et le même format', body: 'Deux noms proches peuvent désigner des volumes, textures ou variantes différents. Vérifiez le nom complet et le nombre de millilitres sur la fiche puis sur l’emballage ; ne comparez pas directement un fluide visage de 30 ml et une crème corps de 125 ml.' },
            { heading: 'Ne pas choisir uniquement sur le montant', body: 'Vérifiez aussi la protection UVA/UVB, les conditions d’utilisation et la résistance à l’eau indiquées par le fabricant. L’OMS et la FDA rappellent qu’un solaire complète les vêtements, l’ombre et les autres mesures de protection.' },
            { heading: 'Parcourir les références solaires disponibles', body: 'La page <a href="/protection-solaire/">solaires du catalogue</a> permet de comparer les noms et formats actuellement listés. Notre article sur le <a href="/conseils/difference-spf-30-spf-50/">SPF 30 et le SPF 50</a> explique aussi pourquoi un indice plus élevé ne remplace pas une bonne application.' },
            { heading: 'Obtenir une confirmation locale', body: 'Transmettez le nom ou le lien de la fiche via la page <a href="/contact/">Contact</a>. Pharmacie Tawfiq confirme la référence, le prix final et les modalités de livraison avant toute expédition.' }
        ], sources: [WHO_UV, FDA_SUN, CONTACT_SOURCE], relatedProductSlugs: solarProducts,
        relatedArticleSlugs: ['meilleure-creme-solaire-spf-50-maroc', 'comment-choisir-creme-solaire-maroc'],
        relatedLinks: [{ href: '/contact/', label: 'Faire confirmer un prix' }, { href: '/livraison/', label: 'Consulter les frais de livraison' }]
    }),
    article({
        slug: 'produits-anti-acne-maroc',
        title: 'Produits anti-acné au Maroc : repères pour une routine prudente',
        description: 'Nettoyage doux, hydratation et protection solaire : repères non médicaux pour comparer des soins destinés aux peaux à imperfections.',
        directAnswer: 'Pour une peau à imperfections, privilégiez une routine courte : nettoyage doux, hydratant non comédogène et solaire adapté. Un cosmétique ne remplace pas un diagnostic ni un traitement ; une acné persistante, douloureuse ou cicatricielle nécessite un avis professionnel.',
        category: 'Visage', categorySlug: 'visage',
        sections: [
            { heading: 'Distinguer soin cosmétique et traitement', body: 'Le catalogue permet d’identifier des nettoyants et soins par leur nom commercial, sans affirmer qu’ils traitent l’acné. Un pharmacien ou dermatologue peut orienter une situation persistante ; ce guide reste limité aux gestes de soin général.' },
            { heading: 'Commencer par un nettoyage doux', body: 'L’American Academy of Dermatology conseille un nettoyage doux jusqu’à deux fois par jour et après une forte transpiration, sans gommage agressif. Notre <a href="/conseils/comment-choisir-nettoyant-visage/">guide des nettoyants visage</a> aide à comparer les formats.' },
            { heading: 'Éviter de multiplier les changements', body: 'Introduisez les produits progressivement et suivez leur mode d’emploi. Une accumulation de nettoyants ou un frottement répété peut irriter la peau ; le fait de percer ou manipuler les imperfections augmente aussi les risques de marques.' },
            { heading: 'Comparer uniquement des références réelles', body: 'Les gels Avène Cleanance et ISDIN Acniben présents dans les <a href="/soins-visage/">soins visage</a> sont proposés comme références catalogue, pas comme prescriptions. Les bénéfices, ingrédients et indications doivent être vérifiés sur l’emballage ou la documentation officielle.' },
            { heading: 'Savoir quand demander conseil', body: 'Demandez un avis qualifié si les lésions sont profondes, douloureuses, s’étendent ou laissent des cicatrices, ou si vous suivez déjà un traitement. N’ajoutez pas un actif au hasard sur la base d’un nom de produit.' }
        ], sources: [AAD_ACNE], relatedProductSlugs: [...cleananceProducts, 'isdin-acniben-gel-nettoyant-400'],
        relatedArticleSlugs: ['routine-peau-grasse', 'comment-choisir-nettoyant-visage', 'avene-cleanance-prix-maroc']
    }),
    article({
        slug: 'parapharmacie-en-ligne-livraison-maroc',
        title: 'Parapharmacie en ligne et livraison au Maroc : mode d’emploi',
        description: 'Comment commander, faire confirmer le prix et connaître les frais de livraison Parapharmacie.me au Maroc.',
        directAnswer: 'Sur Parapharmacie.me, choisissez des références dans le catalogue puis faites confirmer prix et disponibilité avant expédition. Les frais publiés sont de 15 MAD pour Khouribga; toute zone proche doit être confirmée explicitement. Le tarif est de 35 MAD pour les autres villes marocaines desservies.',
        category: 'Achat et livraison', categorySlug: 'hygiene',
        sections: [
            { heading: 'Parcourir le catalogue sans ambiguïté', body: 'La <a href="/boutique/">boutique en ligne</a> présente les références par catégorie. Sans preuve courante, aucun montant n’est affiché et une fiche ne garantit pas le stock.' },
            { heading: 'Faire confirmer la référence et le prix', body: 'Envoyez le nom exact ou le lien de la fiche via <a href="/contact/">téléphone ou WhatsApp</a>. L’équipe confirme le produit, la variante, le montant final et la possibilité de livraison.' },
            { heading: 'Comprendre les frais annoncés', body: 'Les <a href="/livraison/">modalités de livraison</a> indiquent 15 MAD pour Khouribga; toute zone proche doit être confirmée explicitement. Le tarif est de 35 MAD pour les autres villes du Maroc desservies. Le délai précis est communiqué lors de la confirmation ; aucune livraison le jour même n’est promise.' },
            { heading: 'Paiement et disponibilité des moyens', body: 'Le paiement à la livraison est actif. CMI et Apple Pay sont signalés comme bientôt disponibles et ne doivent pas être considérés comme des moyens actifs au moment de la commande.' },
            { heading: 'Vérifier avant de valider', body: 'Relisez le nom, le format, la quantité, l’adresse et les frais confirmés. Pour un service de proximité, consultez la page <a href="/parapharmacie-khouribga/">Parapharmacie à Khouribga</a>.' }
        ], sources: [DELIVERY_SOURCE, CONTACT_SOURCE], relatedProductSlugs: [],
        relatedArticleSlugs: ['comparer-prix-parapharmacie-maroc', 'commander-parapharmacie-khouribga'],
        relatedLinks: [{ href: '/boutique/', label: 'Parcourir le catalogue' }, { href: '/livraison/', label: 'Lire les modalités de livraison' }]
    }),
    article({
        slug: 'avene-cleanance-prix-maroc',
        title: 'Avène Cleanance au Maroc : prix et références du catalogue',
        description: 'Identifiez les formats Avène Cleanance réellement listés et la méthode pour confirmer leur prix et leur disponibilité au Maroc.',
        directAnswer: 'Le catalogue contient trois références Avène Cleanance : deux gels nettoyants de 200 ml et 400 ml, ainsi qu’une crème lavante Hydra de 200 ml. Aucun prix actuel n’étant marqué comme vérifié, demandez une confirmation avant commande.',
        category: 'Visage', categorySlug: 'visage',
        sections: [
            { heading: 'Les références présentes, sans variante inventée', body: 'Les fiches liées ci-dessous correspondent aux trois identifiants réels du catalogue. Le format fait partie du nom : vérifiez-le pour éviter de confondre le gel 200 ml, le gel 400 ml et la crème lavante Hydra 200 ml.' },
            { heading: 'Pourquoi le guide ne donne pas de prix exact', body: 'Aucune date de vérification courante n’est renseignée. Aucun montant n’est donc publié : <a href="/contact/">contactez l’équipe</a> pour faire confirmer le prix.' },
            { heading: 'Ce que confirme la documentation officielle', body: 'La page officielle Avène consultée confirme l’existence du gel nettoyant Cleanance et ses formats 100, 200 et 400 ml. Ce guide ne reprend ni promesse commerciale ni composition ; l’emballage de la référence vendue reste prioritaire.' },
            { heading: 'Choisir selon le type de produit, pas selon une promesse', body: 'Un gel nettoyant et une crème lavante ne sont pas interchangeables par leur seul nom. Lisez le type de produit, le format et le mode d’emploi, puis consultez notre guide sur le <a href="/conseils/comment-choisir-nettoyant-visage/">choix d’un nettoyant</a>.' },
            { heading: 'Commander la bonne variante', body: 'Envoyez le lien exact de la fiche, pas seulement « Cleanance ». Le prix, le stock et les conditions de <a href="/livraison/">livraison au Maroc</a> sont confirmés avant expédition.' }
        ], sources: [AVENE_CLEANANCE, CONTACT_SOURCE], relatedProductSlugs: cleananceProducts,
        relatedArticleSlugs: ['produits-anti-acne-maroc', 'routine-peau-grasse', 'comparer-prix-parapharmacie-maroc']
    }),
    article({
        slug: 'bioderma-sensibio-prix-maroc',
        title: 'Bioderma Sensibio au Maroc : prix et variantes du catalogue',
        description: 'Comparez les références Bioderma Sensibio réellement listées et faites confirmer leur prix actuel avant commande.',
        directAnswer: 'Le catalogue liste plusieurs références Sensibio, dont un gel moussant 200 ml, une eau H2O AR 250 ml et des crèmes de 40 ml. Le prix actuel et le stock ne sont pas vérifiés en temps réel : confirmez toujours la fiche exacte.',
        category: 'Visage', categorySlug: 'visage',
        sections: [
            { heading: 'Commencer par le nom complet et le format', body: '« Sensibio » désigne une gamme, pas un produit unique. Comparez le type — gel, eau, crème ou masque — puis le volume. Les produits liés sont les variantes réellement présentes dans le catalogue.' },
            { heading: 'Comprendre le nom Créaline ou Sensibio', body: 'La documentation française de Bioderma présente le gel sous le nom Créaline, tandis que le catalogue utilise Sensibio. Ce guide signale cette différence de marché sans prétendre que toutes les formulations régionales sont identiques.' },
            { heading: 'Ne pas publier un montant non vérifié', body: 'Aucun prix actuel de ces références n’est daté comme vérifié dans le catalogue. Le montant final et la disponibilité doivent donc être demandés via la page <a href="/contact/">Contact</a>.' },
            { heading: 'Comparer selon l’usage indiqué', body: 'Un produit à rincer et une eau nettoyante ne s’utilisent pas de la même manière. Lisez l’étiquette et le mode d’emploi de la variante reçue ; pour une peau réactive, voyez aussi notre guide sur les <a href="/conseils/soins-peau-sensible/">soins de peau sensible</a>.' },
            { heading: 'Transmettre le lien exact avant commande', body: 'Pour limiter les erreurs, envoyez l’URL de la fiche choisie avec son format. L’équipe confirme la référence, le prix et les <a href="/livraison/">modalités de livraison</a>.' }
        ], sources: [BIODERMA_SENSIBIO, CONTACT_SOURCE], relatedProductSlugs: sensibioProducts,
        relatedArticleSlugs: ['soins-peau-sensible', 'comment-choisir-nettoyant-visage', 'comparer-prix-parapharmacie-maroc']
    }),
    article({
        slug: 'produits-parapharmacie-bebe-maroc',
        title: 'Produits de parapharmacie pour bébé au Maroc : choisir simplement',
        description: 'Des critères prudents pour choisir des produits d’hygiène bébé réellement présents au catalogue, sans multiplier les achats.',
        directAnswer: 'Pour l’hygiène courante d’un bébé, une routine simple suffit généralement. Choisissez un produit adapté à l’âge et à l’usage indiqué, lisez l’étiquette, préparez le bain en sécurité et demandez conseil en cas de rougeur persistante.',
        category: 'Bébé et maman', categorySlug: 'bebe-maman',
        sections: [
            { heading: 'Commencer par le besoin concret', body: 'Distinguez bain, toilette sans rinçage et accessoire. Un nom de gamme ne suffit pas : vérifiez l’âge, la zone et le mode d’emploi indiqués sur l’emballage avant toute utilisation.' },
            { heading: 'Garder une routine courte', body: 'Le NHS indique qu’un nouveau-né n’a pas besoin d’un bain quotidien et recommande l’eau seule pendant le premier mois. Notre guide sur l’<a href="/conseils/hygiene-bebe-conseils/">hygiène du bébé</a> reprend les précautions générales sans remplacer l’avis du pédiatre.' },
            { heading: 'Préparer le bain avant de commencer', body: 'Réunissez serviette, couche et vêtements à portée de main, contrôlez la température et ne laissez jamais le bébé seul dans l’eau. Ces règles de sécurité comptent davantage que le nombre de produits utilisés.' },
            { heading: 'Comparer les références du catalogue', body: 'La catégorie <a href="/bebe-et-maman/">Bébé et maman</a> contient notamment des gels lavants Mustela, une crème lavante Uriage et un lait de toilette Dodie. Leur présence au catalogue n’est ni un classement ni une recommandation personnalisée.' },
            { heading: 'Confirmer et demander conseil si nécessaire', body: 'Le prix et la disponibilité doivent être confirmés. En cas d’irritation persistante, de fièvre, de douleur ou de signe inhabituel, cessez l’usage et contactez un professionnel de santé.' }
        ], sources: [NHS_BABY], relatedProductSlugs: babyProducts,
        relatedArticleSlugs: ['hygiene-bebe-conseils', 'comment-lire-etiquette-cosmetique']
    }),
    article({
        slug: 'protection-solaire-visage-corps-maroc',
        title: 'Protection solaire visage ou corps au Maroc : quels critères comparer ?',
        description: 'Format, zone, large spectre et réapplication : comparez une protection solaire visage et corps sans raccourci marketing.',
        directAnswer: 'Un solaire visage et un solaire corps doivent d’abord offrir la protection indiquée sur leur étiquette et être appliqués en quantité suffisante. Le format et la texture servent surtout à faciliter un usage régulier sur la zone concernée.',
        category: 'Protection solaire', categorySlug: 'solaire',
        sections: [
            { heading: 'La zone d’application guide surtout le format', body: 'Les petits fluides sont faciles à transporter pour le visage ; les formats plus grands sont pratiques pour les zones corporelles étendues. Cette différence de confort ne permet pas, à elle seule, de juger le niveau de protection.' },
            { heading: 'Lire les mentions de protection', body: 'Vérifiez le SPF, la couverture UVA ou « large spectre », la résistance à l’eau et les instructions du fabricant. L’OMS rappelle que le solaire doit compléter l’ombre, les vêtements et la réduction de l’exposition.' },
            { heading: 'Prévoir la réapplication', body: 'La FDA recommande de renouveler environ toutes les deux heures et plus souvent après baignade ou transpiration selon l’étiquette. Choisissez donc un format que vous pouvez emporter et réutiliser correctement.' },
            { heading: 'Comparer sans inventer les propriétés', body: 'La <a href="/protection-solaire/">catégorie solaire</a> affiche les termes et formats présents dans le catalogue. Nous ne déduisons pas une composition, une tolérance ou un bénéfice du seul nom commercial.' },
            { heading: 'Compléter par les bons repères', body: 'Consultez le <a href="/conseils/comment-choisir-creme-solaire-maroc/">guide solaire Maroc</a> pour les critères généraux et la comparaison <a href="/conseils/difference-spf-30-spf-50/">SPF 30 ou SPF 50</a> pour comprendre l’indice.' }
        ], sources: [WHO_UV, FDA_SUN], relatedProductSlugs: solarProducts,
        relatedArticleSlugs: ['comment-choisir-creme-solaire-maroc', 'difference-spf-30-spf-50', 'meilleure-creme-solaire-spf-50-maroc']
    }),
    article({
        slug: 'comparer-prix-parapharmacie-maroc',
        title: 'Comparer les prix de parapharmacie au Maroc sans se tromper',
        description: 'Une méthode pour comparer format, variante, disponibilité et livraison quand les prix ne sont pas encore vérifiés.',
        directAnswer: 'Comparez toujours la même marque, la même variante et le même format, puis ajoutez les frais de livraison. Parapharmacie.me ne publie aucun montant sans preuve propriétaire datée de moins de 30 jours : demandez une confirmation avant de commander.',
        category: 'Achat et livraison', categorySlug: 'hygiene',
        sections: [
            { heading: 'Comparer des références strictement identiques', body: 'Notez le nom complet, le volume, la quantité et toute mention de variante. Une différence de format peut expliquer un écart apparent et rend une comparaison directe trompeuse.' },
            { heading: 'Distinguer prix inconnu et prix confirmé', body: 'Faute de date de vérification actuelle, les fiches indiquent « Prix à confirmer » au lieu de publier un montant. Le prix applicable est communiqué avant expédition.' },
            { heading: 'Intégrer la livraison à la comparaison', body: 'Les frais publiés sont détaillés sur la page <a href="/livraison/">Livraison</a>. Vérifiez la ville desservie, le montant confirmé et le délai annoncé pour votre commande.' },
            { heading: 'Contrôler disponibilité et mode de paiement', body: 'Une référence visible peut être indisponible. Le paiement à la livraison est actif ; CMI et Apple Pay sont seulement annoncés pour plus tard. Ne validez jamais sur la base d’un moyen non actif.' },
            { heading: 'Conserver une confirmation claire', body: 'Envoyez les liens exacts des fiches via <a href="/contact/">WhatsApp ou téléphone</a> et relisez le récapitulatif. Pour Khouribga, la page locale rassemble aussi l’adresse, les horaires et l’itinéraire.' }
        ], sources: [DELIVERY_SOURCE, CONTACT_SOURCE], relatedProductSlugs: [],
        relatedArticleSlugs: ['parapharmacie-en-ligne-livraison-maroc', 'avene-cleanance-prix-maroc', 'bioderma-sensibio-prix-maroc'],
        relatedLinks: [{ href: '/parapharmacie-khouribga/', label: 'Vérifier le service à Khouribga' }]
    }),
    article({
        slug: 'commander-parapharmacie-khouribga',
        title: 'Commander en parapharmacie à Khouribga : étapes et livraison',
        description: 'Catalogue, confirmation par WhatsApp, frais locaux et adresse : les étapes vérifiées pour commander à Khouribga.',
        directAnswer: 'À Khouribga, parcourez le catalogue, envoyez les références choisies à Pharmacie Tawfiq et attendez la confirmation du prix et du stock. La livraison locale publiée coûte 15 MAD ; le délai précis est communiqué avant validation.',
        category: 'Khouribga', categorySlug: 'hygiene',
        sections: [
            { heading: 'Choisir les références dans le catalogue', body: 'Parcourez la <a href="/boutique/">boutique</a> par catégorie et ouvrez chaque fiche utile. Les noms et formats servent à identifier le produit ; sans preuve courante, le prix reste à confirmer.' },
            { heading: 'Envoyer une demande précise', body: 'Utilisez les coordonnées publiées sur la page <a href="/contact/">Contact</a> et transmettez les liens, formats et quantités. Cette étape permet de confirmer la bonne variante et d’éviter une substitution implicite.' },
            { heading: 'Faire confirmer le prix et le stock', body: 'Une fiche indexable ne constitue pas une garantie de disponibilité. Attendez la confirmation explicite du stock, du prix final et du récapitulatif avant de considérer la commande comme validée.' },
            { heading: 'Comprendre la livraison locale', body: 'Les frais publiés sont de 15 MAD pour Khouribga. Une zone proche ne relève jamais automatiquement de ce tarif et doit être confirmée explicitement. Le délai est confirmé au cas par cas et le site ne promet pas une livraison le jour même. Consultez les <a href="/livraison/">modalités complètes</a>.' },
            { heading: 'Retrouver le magasin physique', body: 'La page <a href="/parapharmacie-khouribga/">Parapharmacie à Khouribga</a> affiche l’adresse vérifiée de Pharmacie Tawfiq, ses horaires, son téléphone, WhatsApp et l’itinéraire Google Maps.' }
        ], sources: [DELIVERY_SOURCE, CONTACT_SOURCE], relatedProductSlugs: [],
        relatedArticleSlugs: ['parapharmacie-en-ligne-livraison-maroc', 'comparer-prix-parapharmacie-maroc'],
        relatedLinks: [{ href: '/parapharmacie-khouribga/', label: 'Adresse et horaires à Khouribga' }, { href: '/retours-remboursements/', label: 'Lire le statut de la politique de retour' }]
    })
];
