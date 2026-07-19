import { growthArticles } from './growth-articles-data.js';

// Source of truth for the /conseils/ content hub. Each entry is prerendered
// into a standalone article page by scripts/generate-seo-pages.mjs.
//
// Content rules (do not violate when adding articles):
// - Cosmetic/hygiene education only — no diagnosis, no prescription, no
//   promised outcomes, no invented ingredients/certifications/benefits.
// - `sources` must be exact primary/official pages that support the text.
// - `categorySlug` must match a real js/catalog-data.js category slug so
//   related-products/related-category links resolve to real pages.

const DISCLAIMER = 'Cet article a un objectif d’information générale et cosmétique. Il ne constitue ni un diagnostic médical, ni une prescription, ni une promesse de résultat. Pour toute question de santé, de réaction cutanée ou de traitement en cours, demandez conseil à un pharmacien ou à un professionnel de santé.';

const AUTHOR = 'Équipe Parapharmacie.me';

const OMS_SOURCE = { label: 'OMS — Rayonnement ultraviolet (fiche d’information)', url: 'https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation' };
const FDA_SOLAR_SOURCE = { label: 'FDA — Conseils officiels sur la protection solaire', url: 'https://www.fda.gov/consumers/consumer-updates/tips-stay-safe-sun-sunscreen-sunglasses' };
const AAD_ACNE_SOURCE = { label: 'American Academy of Dermatology — Conseils de soin en cas d’acné', url: 'https://www.aad.org/public/diseases/acne/skin-care/tips' };
const AAD_DRY_SOURCE = { label: 'American Academy of Dermatology — Choisir un hydratant', url: 'https://www.aad.org/public/everyday-care/skin-care-basics/dry/pick-moisturizer?pp=1' };
const AAD_PATCH_SOURCE = { label: 'American Academy of Dermatology — Tester un produit de soin', url: 'https://www.aad.org/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products' };
const AAD_HAIR_SOURCE = { label: 'American Academy of Dermatology — Conseils pour des cheveux sains', url: 'https://www.aad.org/public/everyday-care/hair-scalp-care/hair/healthy-hair-tips' };
const NHS_BABY_SOURCE = { label: 'NHS — Donner le bain à son bébé', url: 'https://www.nhs.uk/best-start-in-life/baby/baby-basics/caring-for-your-baby/bathing-your-baby/' };
const EU_COSMETICS_SOURCE = { label: 'Union européenne — Règlement relatif aux produits cosmétiques', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A02009R1223-20240404' };

const existingArticles = [
    {
        slug: 'comment-choisir-creme-solaire-maroc',
        title: 'Comment choisir sa crème solaire au Maroc : le guide complet',
        description: 'Indice SPF, texture, résistance à l’eau : les critères pratiques pour choisir une protection solaire adaptée au climat marocain.',
        category: 'Protection solaire',
        categorySlug: 'solaire',
        heroImage: '/assets/products/category-fallback-solaire.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 6,
        author: AUTHOR,
        sections: [
            {
                heading: 'Pourquoi la protection solaire compte particulièrement au Maroc',
                body: 'Le Maroc bénéficie d’un fort ensoleillement une grande partie de l’année, sur le littoral comme à l’intérieur des terres. Une exposition répétée et non protégée aux rayons ultraviolets (UV) est un facteur reconnu de vieillissement cutané prématuré et d’autres risques pour la peau, quel que soit le phototype. Une protection solaire adaptée est donc un geste utile au quotidien, pas seulement en vacances.'
            },
            {
                heading: 'Comprendre l’indice de protection (SPF)',
                body: 'Le SPF (Sun Protection Factor) indique la capacité d’un produit à filtrer les rayons UVB responsables des coups de soleil. Plus le chiffre est élevé, plus la part de rayons filtrée augmente, mais la progression n’est pas proportionnelle au chiffre affiché. Un SPF adapté se choisit selon le phototype, la durée d’exposition et l’intensité du soleil au moment de la journée.'
            },
            {
                heading: 'UVA, UVB : deux types de rayons à filtrer',
                body: 'Les UVB affectent surtout la surface de la peau, tandis que les UVA pénètrent plus profondément. Un produit efficace doit filtrer les deux catégories : la mention « large spectre » ou un symbole UVA encerclé sur l’emballage signale généralement cette double protection. Vérifiez cette information directement sur l’étiquette du produit choisi.'
            },
            {
                heading: 'Choisir une texture adaptée à sa peau et à son usage',
                body: 'Une texture fluide ou un gel conviennent souvent aux peaux mixtes à grasses et au visage ; une formule plus riche peut être préférée pour les peaux sèches ou pour un usage hivernal. Pour le sport ou la baignade, les formats spray ou stick facilitent l’application sur le corps. Le meilleur choix reste celui que l’on est prêt à appliquer généreusement et régulièrement.'
            },
            {
                heading: 'Quantité et fréquence d’application',
                body: 'La majorité des utilisateurs appliquent une quantité insuffisante de produit, ce qui réduit fortement la protection réelle. Les autorités de santé recommandent une application généreuse avant l’exposition, renouvelée toutes les deux heures environ, et systématiquement après une baignade, une transpiration importante ou un séchage à la serviette.'
            }
        ],
        faq: [
            {
                q: 'Faut-il une crème solaire même quand le ciel est nuageux ?',
                a: 'Oui. Une part significative des rayons UV traverse la couverture nuageuse, donc le risque d’exposition reste présent par temps couvert.'
            },
            {
                q: 'Une crème solaire « résistante à l’eau » dispense-t-elle de réappliquer après la baignade ?',
                a: 'Non. La résistance à l’eau limite la perte de protection pendant une durée définie sur l’emballage, mais une nouvelle application après la baignade ou le séchage reste recommandée.'
            }
        ],
        sources: [OMS_SOURCE, FDA_SOLAR_SOURCE],
        relatedArticleSlugs: ['difference-spf-30-spf-50', 'choisir-produit-selon-type-de-peau']
    },
    {
        slug: 'difference-spf-30-spf-50',
        title: 'SPF 30 ou SPF 50 : quelle est vraiment la différence ?',
        description: 'Le chiffre SPF n’évolue pas de façon proportionnelle : comprendre ce que change réellement le passage d’un SPF 30 à un SPF 50.',
        category: 'Protection solaire',
        categorySlug: 'solaire',
        heroImage: '/assets/products/category-fallback-solaire.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 5,
        author: AUTHOR,
        sections: [
            {
                heading: 'Que mesure réellement le chiffre SPF',
                body: 'Le SPF est un indicateur de laboratoire qui compare le temps théorique nécessaire pour qu’un coup de soleil apparaisse, avec et sans protection, dans des conditions de test standardisées. Il ne correspond pas à un « temps d’exposition sans risque » dans la vraie vie, car de nombreux facteurs (quantité appliquée, transpiration, baignade) modifient son efficacité réelle.'
            },
            {
                heading: 'SPF 30 contre SPF 50 : la différence en pratique',
                body: 'Un indice SPF plus élevé indique une protection UVB supérieure dans les conditions normalisées du test, mais le chiffre ne se traduit ni par un pourcentage simple ni par un temps d’exposition sans risque. Aucun écran solaire ne bloque tous les rayons UV : il faut suivre l’étiquette et associer ombre, vêtements et réapplication.'
            },
            {
                heading: 'Quand privilégier un indice plus élevé',
                body: 'Un indice plus élevé peut être pertinent en cas de phototype clair, d’exposition prolongée en altitude ou en milieu réverbérant (sable, eau, neige), ou pour les zones du corps particulièrement exposées. Il reste toutefois un complément, pas un substitut, aux autres mesures de protection (ombre, vêtements, horaires).'
            },
            {
                heading: 'Les limites du SPF : ce qu’il ne mesure pas',
                body: 'Le SPF seul ne renseigne pas sur la protection contre les UVA. Il convient de vérifier séparément la mention « large spectre » ou un symbole UVA sur l’emballage pour s’assurer d’une protection plus complète.'
            },
            {
                heading: 'Le geste d’application compte autant que le chiffre choisi',
                body: 'Une application trop fine, quel que soit l’indice affiché, réduit fortement la protection réelle obtenue. Appliquer une quantité généreuse et renouveler l’application reste le facteur qui influence le plus la protection au quotidien.'
            }
        ],
        faq: [
            {
                q: 'Un SPF 100 protège-t-il deux fois plus qu’un SPF 50 ?',
                a: 'Le nombre ne permet pas de conclure à une protection réelle deux fois supérieure. Aucun écran solaire ne bloque tous les UV et les consignes d’application restent indispensables.'
            }
        ],
        sources: [OMS_SOURCE, FDA_SOLAR_SOURCE],
        relatedArticleSlugs: ['comment-choisir-creme-solaire-maroc', 'choisir-produit-selon-type-de-peau']
    },
    {
        slug: 'routine-peau-grasse',
        title: 'Routine de soin pour peau grasse : les bons réflexes',
        description: 'Nettoyage, hydratation, protection solaire : comment construire une routine simple et adaptée à une peau grasse ou à tendance brillante.',
        category: 'Visage',
        categorySlug: 'visage',
        heroImage: '/assets/products/category-fallback-visage.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 5,
        author: AUTHOR,
        sections: [
            {
                heading: 'Reconnaître une peau grasse',
                body: 'Une peau grasse se caractérise généralement par un aspect brillant, des pores visibles et une production de sébum plus importante, en particulier sur la zone T (front, nez, menton). Elle peut être plus sujette aux imperfections, sans que cela concerne toutes les personnes de la même façon.'
            },
            {
                heading: 'Les erreurs fréquentes qui aggravent la brillance',
                body: 'Un nettoyage trop fréquent ou trop agressif peut déséquilibrer la peau et, par réaction, stimuler davantage la production de sébum. De même, l’usage répété de produits asséchants ou à base d’alcool n’est pas toujours la meilleure option sur la durée.'
            },
            {
                heading: 'Les étapes d’une routine simple',
                body: 'Un nettoyant doux adapté aux peaux grasses, suivi d’un soin hydratant à texture légère et non comédogène, puis d’une protection solaire non grasse en journée, forment une base raisonnable. L’hydratation reste utile même pour une peau grasse : elle ne s’oppose pas à l’objectif de matifier l’aspect de la peau.'
            },
            {
                heading: 'Fréquence et constance',
                body: 'Deux nettoyages quotidiens (matin et soir) suffisent en général. Les résultats d’une routine s’observent surtout dans la durée : mieux vaut une routine simple suivie régulièrement qu’une accumulation de produits changés trop souvent.'
            },
            {
                heading: 'Quand demander un avis professionnel',
                body: 'En cas d’imperfections persistantes, douloureuses ou inflammatoires, ou si la routine habituelle ne suffit plus, l’avis d’un pharmacien ou d’un dermatologue permet d’orienter vers une prise en charge adaptée à la situation.'
            }
        ],
        faq: [],
        sources: [AAD_ACNE_SOURCE],
        relatedArticleSlugs: ['comment-choisir-nettoyant-visage', 'choisir-produit-selon-type-de-peau']
    },
    {
        slug: 'soins-peau-sensible',
        title: 'Peau sensible : comment adapter sa routine de soin',
        description: 'Facteurs déclenchants, choix des produits, test avant utilisation : les bases pour prendre soin d’une peau sensible au quotidien.',
        category: 'Visage',
        categorySlug: 'visage',
        heroImage: '/assets/products/category-fallback-visage.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 5,
        author: AUTHOR,
        sections: [
            {
                heading: 'Qu’est-ce qu’une peau sensible',
                body: 'La tolérance à un produit varie d’une personne à l’autre. Une réaction persistante ou importante ne doit pas être auto-diagnostiquée à partir d’un article : demandez un avis professionnel adapté.'
            },
            {
                heading: 'Identifier les facteurs déclenchants',
                body: 'Notez le nom du produit, la zone testée, les dates et la réaction observée. Ce suivi factuel aide à éviter de réintroduire plusieurs nouveautés en même temps, sans prétendre identifier une allergie.'
            },
            {
                heading: 'Ne pas traiter une mention comme une garantie',
                body: 'Une mention « peau sensible » ou « hypoallergénique » ne prouve pas qu’un produit sera toléré par chaque personne. Lisez l’étiquette et vérifiez la tolérance selon les instructions de la source citée.'
            },
            {
                heading: 'Tester avant d’adopter un nouveau produit',
                body: 'Avant une utilisation étendue, l’American Academy of Dermatology conseille d’appliquer le produit sur une petite zone, deux fois par jour pendant sept à dix jours, selon les instructions normales du produit. En cas de réaction, cessez l’essai et demandez un avis professionnel si nécessaire.'
            },
            {
                heading: 'Construire une routine minimaliste',
                body: 'Introduire une nouveauté à la fois permet d’identifier plus clairement une éventuelle réaction. Cette précaution générale ne remplace pas l’évaluation d’un dermatologue en cas de problème persistant.'
            }
        ],
        faq: [
            {
                q: 'Une peau sensible est-elle la même chose qu’une peau allergique ?',
                a: 'Non, ce sont deux notions différentes. Une véritable allergie cutanée nécessite un avis médical pour être identifiée ; la sensibilité cutanée décrit une réactivité plus générale de la peau.'
            }
        ],
        sources: [AAD_PATCH_SOURCE],
        relatedArticleSlugs: ['comment-choisir-nettoyant-visage', 'comment-lire-etiquette-cosmetique']
    },
    {
        slug: 'comment-choisir-nettoyant-visage',
        title: 'Comment choisir son nettoyant visage selon son type de peau',
        description: 'Les repères soutenus par la source : nettoyant doux, geste non abrasif, eau tiède et fréquence raisonnable.',
        category: 'Visage',
        categorySlug: 'visage',
        heroImage: '/assets/products/category-fallback-visage.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 5,
        author: AUTHOR,
        sections: [
            {
                heading: 'Le rôle du nettoyant dans une routine',
                body: 'Pour une peau à tendance acnéique, l’American Academy of Dermatology recommande un nettoyant doux et non abrasif. Le choix doit rester compatible avec les instructions du produit et la tolérance individuelle.'
            },
            {
                heading: 'Ne pas déduire la tolérance de la seule texture',
                body: 'La source citée ne permet pas d’attribuer universellement un gel, une mousse, une huile ou un lait à un type de peau. Vérifiez plutôt l’étiquette, introduisez un produit à la fois et cessez son utilisation en cas de réaction.'
            },
            {
                heading: 'Privilégier un geste doux',
                body: 'Appliquez le nettoyant avec le bout des doigts, sans accessoire abrasif, puis rincez à l’eau tiède. Une mention marketing ne garantit pas à elle seule qu’un produit conviendra à chaque personne.'
            },
            {
                heading: 'Fréquence de nettoyage recommandée',
                body: 'Pour une peau à tendance acnéique, la source recommande de limiter le lavage à deux fois par jour et après avoir transpiré. Une situation différente peut nécessiter un conseil personnalisé.'
            },
            {
                heading: 'Les erreurs à éviter',
                body: 'Évitez de frotter la peau et d’utiliser un produit abrasif. Si les lésions persistent, deviennent douloureuses ou s’aggravent, demandez un avis professionnel plutôt que de multiplier les nettoyants.'
            }
        ],
        faq: [],
        sources: [AAD_ACNE_SOURCE],
        relatedArticleSlugs: ['routine-peau-grasse', 'hydratation-peau-seche', 'choisir-produit-selon-type-de-peau']
    },
    {
        slug: 'hydratation-peau-seche',
        title: 'Peau sèche : comment construire une routine hydratante efficace',
        description: 'Ingrédients hydratants, étapes clés, adaptation saisonnière : les bases pour prendre soin d’une peau sèche ou déshydratée.',
        category: 'Visage',
        categorySlug: 'visage',
        heroImage: '/assets/products/category-fallback-visage.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 6,
        author: AUTHOR,
        sections: [
            {
                heading: 'Pourquoi la peau sèche a besoin d’une attention particulière',
                body: 'Une peau sèche produit moins de sébum, ce qui réduit sa capacité naturelle à retenir l’eau et à se protéger des agressions extérieures. Elle peut alors tirailler, peler légèrement ou paraître terne, en particulier lors des changements de saison.'
            },
            {
                heading: 'Les catégories d’ingrédients hydratants à connaître',
                body: 'Les ingrédients dits « humectants » (comme la glycérine ou l’acide hyaluronique) attirent l’eau vers la peau, tandis que les ingrédients « occlusifs » (beurres et huiles végétales, par exemple) aident à limiter la perte en eau. Une routine efficace combine souvent les deux familles.'
            },
            {
                heading: 'Construire une routine hydratante en trois étapes',
                body: 'Un nettoyant doux et non asséchant, un soin hydratant appliqué quotidiennement, puis une protection solaire adaptée en journée forment une base simple. Pour les zones très sèches, un soin plus riche peut être réservé au soir.'
            },
            {
                heading: 'Adapter sa routine selon la saison',
                body: 'Le vent, le froid ou l’air conditionné accentuent souvent la sécheresse cutanée. Une texture plus riche en hiver et plus légère en été permet d’ajuster le confort de la peau tout au long de l’année.'
            },
            {
                heading: 'Signes qui nécessitent un avis professionnel',
                body: 'Des rougeurs marquées, des fissures, des démangeaisons intenses ou persistantes ne relèvent pas d’une simple sécheresse cosmétique et justifient l’avis d’un pharmacien ou d’un dermatologue.'
            }
        ],
        faq: [],
        sources: [AAD_DRY_SOURCE],
        relatedArticleSlugs: ['comment-choisir-nettoyant-visage', 'choisir-produit-selon-type-de-peau']
    },
    {
        slug: 'routine-cheveux-secs',
        title: 'Cheveux secs : la routine à adopter au quotidien',
        description: 'Lavage, après-shampooing, protection solaire et effets du chlore ou du sel : comment prendre soin de cheveux secs ou abîmés.',
        category: 'Cheveux',
        categorySlug: 'cheveux',
        heroImage: '/assets/products/category-fallback-cheveux.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 5,
        author: AUTHOR,
        sections: [
            {
                heading: 'Pourquoi les cheveux deviennent secs',
                body: 'La sécheresse capillaire peut venir de facteurs extérieurs (soleil, chlore, eau de mer, chaleur des appareils coiffants) ou de la nature même du cheveu, plus poreux ou fragilisé par des colorations et décolorations répétées.'
            },
            {
                heading: 'Adapter le lavage : fréquence et température de l’eau',
                body: 'Un lavage trop fréquent ou à l’eau très chaude peut accentuer la sécheresse. Espacer les shampooings lorsque cela est possible et privilégier une eau tiède aide à préserver le film protecteur naturel du cheveu et du cuir chevelu.'
            },
            {
                heading: 'Le rôle de l’après-shampooing et du soin sans rinçage',
                body: 'Un après-shampooing démêlant et un soin sans rinçage appliqué sur longueurs et pointes apportent une couche de confort supplémentaire, en particulier pour les cheveux longs ou fréquemment coiffés à la chaleur.'
            },
            {
                heading: 'Protection face au soleil, au sel et au chlore',
                body: 'Au Maroc, l’exposition estivale au soleil, à l’eau de mer ou aux piscines chlorées peut assécher davantage les cheveux. Rincer les cheveux à l’eau claire après la baignade et couvrir les longueurs (foulard, chapeau) limite cette agression répétée.'
            },
            {
                heading: 'Habitudes du quotidien qui font la différence',
                body: 'Réduire la fréquence d’utilisation des appareils chauffants, utiliser un protecteur thermique avant coiffage, et démêler les cheveux mouillés avec un peigne à dents larges plutôt qu’une brosse limitent la casse et la sécheresse au fil du temps.'
            }
        ],
        faq: [],
        sources: [AAD_HAIR_SOURCE],
        relatedArticleSlugs: ['choisir-produit-selon-type-de-peau']
    },
    {
        slug: 'hygiene-bebe-conseils',
        title: 'Hygiène du bébé : les bases à connaître au quotidien',
        description: 'Bain, change, choix de produits doux : les repères généraux pour l’hygiène quotidienne du bébé, sans se substituer à un avis médical.',
        category: 'Bébé et maman',
        categorySlug: 'bebe-maman',
        heroImage: '/assets/products/category-fallback-bebe-maman.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 5,
        author: AUTHOR,
        sections: [
            {
                heading: 'Les bases de l’hygiène quotidienne du bébé',
                body: 'Le NHS recommande une routine simple. Pendant le premier mois, l’eau seule est la meilleure option pour la peau du bébé ; les gestes doivent rester doux et l’enfant ne doit jamais être laissé seul dans le bain.'
            },
            {
                heading: 'Choisir des produits doux et adaptés',
                body: 'La source conseille d’éviter lotions et huiles pendant au moins le premier mois. Ensuite, suivez les instructions de l’emballage et demandez conseil en cas de doute ; une mention « dès la naissance » ne remplace pas ces précautions.'
            },
            {
                heading: 'La routine du change et la prévention de l’irritation',
                body: 'Changer régulièrement la couche, nettoyer en douceur puis bien sécher la peau avant de la recouvrir sont des gestes simples qui limitent les inconforts liés à l’humidité prolongée.'
            },
            {
                heading: 'Le bain : fréquence et précautions',
                body: 'Un bain n’a pas besoin d’être quotidien pour assurer une bonne hygiène. Une eau tiède, un temps de bain court et un séchage soigneux, notamment dans les plis, sont des repères généraux utiles.'
            },
            {
                heading: 'Quand consulter un professionnel de santé',
                body: 'Une rougeur qui persiste, s’étend ou s’accompagne de fièvre, de pleurs inhabituels ou d’autres signes inquiétants doit être évaluée par un pédiatre, un médecin ou un pharmacien plutôt que traitée uniquement par des produits cosmétiques.'
            }
        ],
        faq: [],
        sources: [NHS_BABY_SOURCE],
        relatedArticleSlugs: ['comment-lire-etiquette-cosmetique']
    },
    {
        slug: 'comment-lire-etiquette-cosmetique',
        title: 'Comment lire une étiquette de produit cosmétique',
        description: 'Liste INCI, date de péremption, précautions d’emploi : apprendre à décoder une étiquette cosmétique avant l’achat.',
        category: 'Hygiène',
        categorySlug: 'hygiene',
        heroImage: '/assets/products/category-fallback-hygiene.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 6,
        author: AUTHOR,
        sections: [
            {
                heading: 'Pourquoi lire l’étiquette avant d’acheter',
                body: 'L’étiquette d’un produit cosmétique contient des informations réglementées qui permettent de vérifier sa composition, ses précautions d’emploi et sa durée de conservation. La lire prend quelques secondes et aide à faire un choix plus éclairé.'
            },
            {
                heading: 'Comprendre la liste INCI',
                body: 'La liste INCI (International Nomenclature of Cosmetic Ingredients) énumère les ingrédients d’un produit, généralement par ordre décroissant de concentration. Les noms sont standardisés au niveau international, ce qui permet de comparer des produits entre eux même s’ils viennent de marques différentes.'
            },
            {
                heading: 'Repérer les mentions utiles',
                body: 'Le symbole représentant un pot ouvert, accompagné d’un nombre suivi de « M », indique la durée d’utilisation recommandée après ouverture (Period After Opening). La quantité, les précautions d’emploi et les éventuelles mises en garde figurent également sur l’emballage.'
            },
            {
                heading: 'Les allégations à interpréter avec prudence',
                body: 'Des mentions comme « naturel », « clean » ou « dermatologiquement testé » ne sont pas toujours encadrées par une définition unique et universelle. Elles méritent d’être mises en perspective avec la liste d’ingrédients plutôt que prises comme une garantie à elles seules.'
            },
            {
                heading: 'Où trouver de l’aide en cas de doute',
                body: 'En cas de doute sur la composition d’un produit, sur une éventuelle réaction ou sur son adéquation avec une situation particulière (grossesse, peau réactive, traitement en cours), un pharmacien reste l’interlocuteur le plus accessible pour un avis adapté.'
            }
        ],
        faq: [],
        sources: [EU_COSMETICS_SOURCE],
        relatedArticleSlugs: ['soins-peau-sensible', 'choisir-produit-selon-type-de-peau']
    },
    {
        slug: 'choisir-produit-selon-type-de-peau',
        title: 'Choisir ses produits selon son type de peau : le guide de base',
        description: 'Peau grasse, sèche, mixte, sensible ou normale : comment identifier son type de peau et adapter nettoyant, hydratation et protection solaire.',
        category: 'Visage',
        categorySlug: 'visage',
        heroImage: '/assets/products/category-fallback-visage.webp',
        publishedDate: '2026-07-12',
        updatedDate: '2026-07-17',
        readingTimeMinutes: 6,
        author: AUTHOR,
        sections: [
            {
                heading: 'Identifier son type de peau',
                body: 'On distingue généralement les peaux grasses (brillance, pores marqués), sèches (tiraillements, aspect terne), mixtes (zone T grasse, joues plus sèches), sensibles (réactivité aux produits ou au climat) et normales (peu de déséquilibres visibles). Le type de peau peut aussi varier selon la saison.'
            },
            {
                heading: 'Adapter le nettoyant à son type de peau',
                body: 'Il n’existe pas de règle universelle attribuant une texture à chaque type de peau. Vérifiez le mode d’emploi et les indications du fabricant, privilégiez un nettoyage doux et observez la tolérance individuelle. Le <a href="/conseils/comment-choisir-nettoyant-visage/">guide du nettoyant visage</a> détaille ces repères sans transformer la texture en diagnostic.'
            },
            {
                heading: 'Adapter l’hydratation',
                body: 'Le choix d’un hydratant dépend de la tolérance, du mode d’emploi et de la situation individuelle ; les sources citées ne justifient pas une correspondance universelle entre texture et type de peau. Introduisez un produit à la fois et demandez conseil en cas d’irritation persistante. Voir aussi les repères prudents sur l’<a href="/conseils/hydratation-peau-seche/">hydratation des peaux sèches</a>.'
            },
            {
                heading: 'Ne pas oublier la protection solaire',
                body: 'Quel que soit le type de peau, une protection solaire adaptée reste une étape recommandée en journée. Consultez notre guide sur le <a href="/conseils/comment-choisir-creme-solaire-maroc/">choix d’une crème solaire au Maroc</a> et sur la <a href="/conseils/difference-spf-30-spf-50/">différence entre les indices SPF</a>.'
            },
            {
                heading: 'Récapitulatif : une routine de base par type de peau',
                body: 'Gardez une routine lisible, suivez les instructions de chaque produit et évitez de déduire une recommandation personnalisée d’une simple étiquette de « type de peau ». En cas de doute, de réaction ou de problème persistant, demandez l’avis d’un professionnel qualifié.'
            }
        ],
        faq: [],
        sources: [AAD_ACNE_SOURCE, AAD_DRY_SOURCE, AAD_PATCH_SOURCE],
        relatedArticleSlugs: [
            'comment-choisir-nettoyant-visage',
            'hydratation-peau-seche',
            'routine-peau-grasse',
            'soins-peau-sensible',
            'comment-choisir-creme-solaire-maroc'
        ]
    }
];

export const articles = [
    ...existingArticles.map((article) => ({ status: 'published', ...article })),
    ...growthArticles
];

export const publishedArticles = articles.filter((article) => article.status === 'published');

export const DISCLAIMER_TEXT = DISCLAIMER;
export const DEFAULT_AUTHOR = AUTHOR;

export function getArticleBySlug(slug) {
    return articles.find((article) => article.slug === slug) || null;
}
