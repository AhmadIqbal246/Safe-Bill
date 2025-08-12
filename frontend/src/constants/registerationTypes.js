// constants/businessTypes.js

// Skills options aligned with businessActivityStructure, categories, and subcategories
export const skillOptions = [
  // Agriculture, sylviculture et pêche
  { value: "culture_vegetale", label: "Culture végétale" },
  { value: "elevage", label: "Élevage" },
  { value: "peche", label: "Pêche" },
  { value: "sylviculture", label: "Sylviculture" },
  
  // Agroalimentaire
  { value: "transformation", label: "Transformation" },
  { value: "conditionnement", label: "Conditionnement" },
  { value: "distribution", label: "Distribution" },
  
  // Arts, culture et spectacles
  { value: "creation", label: "Création" },
  { value: "diffusion", label: "Diffusion" },
  { value: "production", label: "Production" },
  { value: "evenement", label: "Événement" },
  
  // Assurance / Banque / Finance
  { value: "assurance_pro", label: "Assurance pro" },
  { value: "gestion_actifs", label: "Gestion d'actifs" },
  { value: "credit", label: "Crédit" },
  { value: "fintech", label: "Fintech" },
  
  // Conseil / Audit / Gestion
  { value: "conseil_strategie", label: "Conseil stratégie" },
  { value: "comptabilite", label: "Comptabilité" },
  { value: "audit", label: "Audit" },
  { value: "rh", label: "RH" },
  
  // BTP (Bâtiment et travaux publics)
  { value: "construction", label: "Construction" },
  
  // Commerce / Distribution
  { value: "materiaux", label: "Matériaux" },
  { value: "gros", label: "Gros" },
  { value: "detail", label: "Détail" },
  { value: "import_export", label: "Import-export" },
  { value: "e_commerce", label: "E-commerce" },
  
  // Communication / Publicité
  { value: "agence", label: "Agence" },
  { value: "relations_presse", label: "Relations presse" },
  { value: "web_marketing", label: "Web-marketing" },
  
  // Digital
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  
  // Éducation / Formation
  { value: "formation_pro", label: "Formation pro" },
  { value: "enseignement", label: "Enseignement" },
  { value: "coaching", label: "Coaching" },
  { value: "e_learning", label: "E-learning" },
  
  // Énergie / Environnement
  { value: "production_energie", label: "Production d'énergie" },
  { value: "gestion_dechets", label: "Gestion des déchets" },
  { value: "energies_renouvelables", label: "Énergies renouvelables" },
  
  // Fonction publique / Administration
  { value: "collectivites", label: "Collectivités" },
  { value: "administration_centrale", label: "Administration centrale" },
  { value: "services_sociaux", label: "Services sociaux" },
  
  // Hôtellerie / Restauration / Tourisme
  { value: "hebergement", label: "Hébergement" },
  { value: "restauration", label: "Restauration" },
  { value: "voyages", label: "Voyages" },
  { value: "evenementiel", label: "Événementiel" },
  
  // Ingénierie / Recherche et développement
  { value: "materiel", label: "Matériel" },
  { value: "services_ingenierie", label: "Services d'ingénierie" },
  { value: "bureau_etudes", label: "Bureau d'études" },
  { value: "innovation", label: "Innovation" },
  { value: "prototypage", label: "Prototypage" },
  
  // Juridique & Légal
  { value: "cabinet", label: "Cabinet" },
  { value: "avocat", label: "Avocat" },
  { value: "notaire", label: "Notaire" },
  { value: "conseil_juridique", label: "Conseil juridique" },
  
  // Logistique / Transport / Supply Chain
  { value: "transport_routier", label: "Transport routier" },
  { value: "maritime", label: "Maritime" },
  { value: "aerien", label: "Aérien" },
  { value: "entreposage", label: "Entreposage" },
  
  // Luxe / Mode / Textile
  { value: "creation_mode", label: "Création mode" },
  { value: "distribution_mode", label: "Distribution mode" },
  { value: "accessoires", label: "Accessoires" },
  { value: "cosmetique", label: "Cosmétique" },
  
  // Marketing / Webmarketing
  { value: "marketing_digital", label: "Marketing digital" },
  { value: "communication", label: "Communication" },
  { value: "publicite", label: "Publicité" },
  { value: "seo_sea", label: "SEO/SEA" },
  { value: "social_media", label: "Social media" },
  { value: "etudes_marche", label: "Études de marché" },
  
  // Ressources humaines
  { value: "recrutement", label: "Recrutement" },
  { value: "gestion_paie", label: "Gestion de paie" },
  { value: "formation_rh", label: "Formation RH" },
  { value: "conseil_rh", label: "Conseil RH" },
  { value: "externalisation_rh", label: "Externalisation RH" },
  { value: "coaching_rh", label: "Coaching RH" },
  { value: "mobilite", label: "Mobilité" },
  { value: "droit_travail", label: "Droit du travail" },
  
  // Sécurité / Défense
  { value: "securite_privee", label: "Sécurité privée" },
  { value: "gardiennage", label: "Gardiennage" },
  { value: "securite_electronique", label: "Sécurité électronique" },
  { value: "surveillance", label: "Surveillance" },
  { value: "defense", label: "Défense" },
  { value: "protection_rapprochee", label: "Protection rapprochée" },
  { value: "securite_incendie", label: "Sécurité incendie" },
  
  // Social / Insertion / Handicap
  { value: "accompagnement", label: "Accompagnement" },
  { value: "aide_sociale", label: "Aide sociale" },
  { value: "insertion_pro", label: "Insertion professionnelle" },
  
  // Sport / Loisirs
  { value: "clubs", label: "Clubs" },
  { value: "gestion_equipements", label: "Gestion d'équipements" },
  
  // Services aux entreprises
  { value: "proprete_locaux", label: "Propreté des locaux" },
  { value: "services_entreprises", label: "Services aux entreprises" },
  { value: "desinfection", label: "Désinfection" },
  { value: "gestion_dechets_entreprises", label: "Gestion des déchets" },
  { value: "blanchisserie", label: "Blanchisserie" },
  
  // Recrutement & Services
  { value: "chasse_tetes", label: "Chasse de têtes" },
  { value: "portage_salarial", label: "Portage salarial" },
  { value: "recrutement_digital", label: "Recrutement digital" },
  { value: "talent_acquisition", label: "Talent acquisition" },
  
  // Construction & Intérieur
  { value: "plafonds_suspendus", label: "Plafonds suspendus" },
  { value: "faux_plafonds_decoratifs", label: "Faux plafonds décoratifs" },
  { value: "peinture_plafond", label: "Peinture de plafond" },
  { value: "plafonds_tendus", label: "Plafonds tendus" },
  { value: "portes_interieures", label: "Portes intérieures" },
  { value: "placards_rangements", label: "Placards et rangements" },
  { value: "escaliers_interieurs", label: "Escaliers intérieurs" },
  { value: "parquets_plinthes", label: "Parquets et plinthes" },
  { value: "habillages_divers", label: "Habillages divers" },
  
  // Technologies
  { value: "python_tech", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "html5", label: "HTML5" },
  { value: "cybersecurite", label: "Cybersécurité" },
  { value: "cloud_computing", label: "Cloud computing" },
  { value: "ux_ui", label: "UX/UI" },
  { value: "data", label: "Data" },
  { value: "e_commerce_tech", label: "E-commerce tech" },
  { value: "reseaux_sociaux", label: "Réseaux sociaux" },
  
  // Traditional skills (keeping some for backward compatibility)
  { value: "plomberie", label: "Plomberie" },
  { value: "electricite", label: "Électricité" },
  { value: "peinture", label: "Peinture" },
  { value: "menuisier", label: "Menuiserie" },
  { value: "nettoyage", label: "Nettoyage" },
  { value: "construction_traditionnelle", label: "Construction traditionnelle" },
  { value: "maintenance_batiment", label: "Maintenance de bâtiment" },
  { value: "jardinage", label: "Jardinage/Paysagisme" },
  { value: "serrurerie", label: "Serrurerie" },
  { value: "vitrerie", label: "Vitrerie" },
  { value: "carrelage", label: "Carrelage" },
  { value: "sol", label: "Sol" },
  { value: "platre", label: "Plâtre" },
  { value: "isolation", label: "Isolation" },
  { value: "chauffage_climatisation", label: "Chauffage/Climatisation" },
  { value: "toiture", label: "Toiture" },
  { value: "fenetres_portes", label: "Fenêtres et portes" },
  { value: "cuisine_salle_bain", label: "Installation cuisine/salle de bain" },
  { value: "appareils_electriques", label: "Appareils électriques" },
  { value: "montage_meubles", label: "Montage de meubles" },
  { value: "demenagement", label: "Services de déménagement" },
  { value: "deratisation", label: "Dératisation" },
  { value: "ramonage", label: "Ramonage" },
  { value: "systemes_securite", label: "Systèmes de sécurité" },
  { value: "decoration_interieur", label: "Décoration d'intérieur" },
  { value: "bricolage", label: "Services de bricolage" },
  { value: "gestion_dechets_traditionnelle", label: "Gestion des déchets" },
  { value: "restauration_eau", label: "Restauration après dégâts d'eau" },
  { value: "peinture_decoration", label: "Peinture et décoration" },
  { value: "renovation_traditionnelle", label: "Rénovation" },
  { value: "audit_energetique", label: "Audit énergétique" }
];

// New hierarchical business activity structure based on French classifications
export const businessActivityStructure = [
  {
    id: "agriculture_sylviculture_peche",
    label: "Agriculture, sylviculture et pêche",
    categories: [
      {
        id: "culture_vegetale",
        label: "Culture végétale",
        subcategories: []
      },
      {
        id: "elevage",
        label: "Élevage",
        subcategories: []
      },
      {
        id: "peche",
        label: "Pêche",
        subcategories: []
      },
      {
        id: "sylviculture",
        label: "Sylviculture",
        subcategories: []
      }
    ]
  },
  {
    id: "agroalimentaire",
    label: "Agroalimentaire",
    categories: [
      {
        id: "transformation",
        label: "Transformation",
        subcategories: []
      },
      {
        id: "conditionnement",
        label: "Conditionnement",
        subcategories: []
      },
      {
        id: "distribution",
        label: "Distribution",
        subcategories: []
      }
    ]
  },
  {
    id: "arts_culture_spectacles",
    label: "Arts, culture et spectacles",
    categories: [
      {
        id: "creation",
        label: "Création",
        subcategories: []
      },
      {
        id: "diffusion",
        label: "Diffusion",
        subcategories: []
      },
      {
        id: "production",
        label: "Production",
        subcategories: []
      },
      {
        id: "evenement",
        label: "Événement",
        subcategories: []
      }
    ]
  },
  {
    id: "assurance_banque_finance",
    label: "Assurance / Banque / Finance",
    categories: [
      {
        id: "assurance_pro",
        label: "Assurance pro",
        subcategories: []
      },
      {
        id: "gestion_actifs",
        label: "Gestion d'actifs",
        subcategories: []
      },
      {
        id: "credit",
        label: "Crédit",
        subcategories: []
      },
      {
        id: "fintech",
        label: "Fintech",
        subcategories: []
      }
    ]
  },
  {
    id: "conseil_audit_gestion",
    label: "Conseil / Audit / Gestion",
    categories: [
      {
        id: "conseil_strategie",
        label: "Conseil stratégie",
        subcategories: []
      },
      {
        id: "comptabilite",
        label: "Comptabilité",
        subcategories: []
      },
      {
        id: "audit",
        label: "Audit",
        subcategories: []
      },
      {
        id: "rh",
        label: "RH",
        subcategories: []
      }
    ]
  },
  {
    id: "btp",
    label: "BTP (Bâtiment et travaux publics)",
    categories: [
      {
        id: "construction",
        label: "Construction",
        subcategories: []
      }
    ]
  },
  {
    id: "commerce_distribution",
    label: "Commerce / Distribution",
    categories: [
      {
        id: "materiaux",
        label: "Matériaux",
        subcategories: []
      },
      {
        id: "gros",
        label: "Gros",
        subcategories: []
      },
      {
        id: "detail",
        label: "Détail",
        subcategories: []
      },
      {
        id: "import_export",
        label: "Import-export",
        subcategories: []
      },
      {
        id: "e_commerce",
        label: "E-commerce",
        subcategories: []
      }
    ]
  },
  {
    id: "communication_publicite",
    label: "Communication / Publicité",
    categories: [
      {
        id: "agence",
        label: "Agence",
        subcategories: []
      },
      {
        id: "relations_presse",
        label: "Relations presse",
        subcategories: []
      },
      {
        id: "web_marketing",
        label: "Web-marketing",
        subcategories: []
      }
    ]
  },
  {
    id: "digital",
    label: "Digital",
    categories: [
      {
        id: "web_developpement",
        label: "Web développement",
        subcategories: [
          { id: "html", label: "HTML" },
          { id: "css", label: "CSS" },
          { id: "javascript", label: "JavaScript" },
          { id: "typescript", label: "TypeScript" },
          { id: "php", label: "PHP" },
          { id: "python", label: "Python" },
          { id: "ruby", label: "Ruby" }
        ]
      }
    ]
  },
  {
    id: "education_formation",
    label: "Éducation / Formation",
    categories: [
      {
        id: "formation_pro",
        label: "Formation pro",
        subcategories: []
      },
      {
        id: "enseignement",
        label: "Enseignement",
        subcategories: []
      },
      {
        id: "coaching",
        label: "Coaching",
        subcategories: []
      },
      {
        id: "e_learning",
        label: "E-learning",
        subcategories: []
      }
    ]
  },
  {
    id: "energie_environnement",
    label: "Énergie / Environnement",
    categories: [
      {
        id: "production",
        label: "Production",
        subcategories: []
      },
      {
        id: "gestion_dechets",
        label: "Gestion déchets",
        subcategories: []
      },
      {
        id: "energies_renouvelables",
        label: "Énergies renouvelables",
        subcategories: []
      }
    ]
  },
  {
    id: "fonction_publique_administration",
    label: "Fonction publique / Administration",
    categories: [
      {
        id: "collectivites",
        label: "Collectivités",
        subcategories: []
      },
      {
        id: "administration_centrale",
        label: "Administration centrale",
        subcategories: []
      },
      {
        id: "services_sociaux",
        label: "Services sociaux",
        subcategories: []
      }
    ]
  },
  {
    id: "hotellerie_restauration_tourisme",
    label: "Hôtellerie / Restauration / Tourisme",
    categories: [
      {
        id: "hebergement",
        label: "Hébergement",
        subcategories: []
      },
      {
        id: "restauration",
        label: "Restauration",
        subcategories: []
      },
      {
        id: "voyages",
        label: "Voyages",
        subcategories: []
      },
      {
        id: "evenementiel",
        label: "Événementiel",
        subcategories: []
      }
    ]
  },
  {
    id: "ingenierie_recherche_developpement",
    label: "Ingénierie / Recherche et développement",
    categories: [
      {
        id: "materiel",
        label: "Matériel",
        subcategories: []
      },
      {
        id: "services",
        label: "Services",
        subcategories: []
      },
      {
        id: "bureau_etudes",
        label: "Bureau d'études",
        subcategories: []
      },
      {
        id: "innovation",
        label: "Innovation",
        subcategories: []
      },
      {
        id: "prototypage",
        label: "Prototypage",
        subcategories: []
      }
    ]
  },
  {
    id: "juridique_legal",
    label: "Juridique & Légal",
    categories: [
      {
        id: "cabinet",
        label: "Cabinet",
        subcategories: []
      },
      {
        id: "avocat",
        label: "Avocat",
        subcategories: []
      },
      {
        id: "notaire",
        label: "Notaire",
        subcategories: []
      },
      {
        id: "conseil_juridique",
        label: "Conseil juridique",
        subcategories: []
      }
    ]
  },
  {
    id: "logistique_transport_supply_chain",
    label: "Logistique / Transport / Supply Chain",
    categories: [
      {
        id: "transport_routier",
        label: "Transport routier",
        subcategories: []
      },
      {
        id: "maritime",
        label: "Maritime",
        subcategories: []
      },
      {
        id: "aerien",
        label: "Aérien",
        subcategories: []
      },
      {
        id: "entreposage",
        label: "Entreposage",
        subcategories: []
      }
    ]
  },
  {
    id: "luxe_mode_textile",
    label: "Luxe / Mode / Textile",
    categories: [
      {
        id: "creation",
        label: "Création",
        subcategories: []
      },
      {
        id: "distribution",
        label: "Distribution",
        subcategories: []
      },
      {
        id: "accessoires",
        label: "Accessoires",
        subcategories: []
      },
      {
        id: "cosmetique",
        label: "Cosmétique",
        subcategories: []
      }
    ]
  },
  {
    id: "marketing_webmarketing",
    label: "Marketing / Webmarketing",
    categories: [
      {
        id: "marketing_digital",
        label: "Marketing digital",
        subcategories: []
      },
      {
        id: "communication",
        label: "Communication",
        subcategories: []
      },
      {
        id: "publicite",
        label: "Publicité",
        subcategories: []
      },
      {
        id: "seo_sea",
        label: "SEO/SEA",
        subcategories: []
      },
      {
        id: "social_media",
        label: "Social media",
        subcategories: []
      },
      {
        id: "etudes_marche",
        label: "Études de marché",
        subcategories: []
      }
    ]
  },
  {
    id: "ressources_humaines",
    label: "Ressources humaines",
    categories: [
      {
        id: "recrutement",
        label: "Recrutement",
        subcategories: []
      },
      {
        id: "gestion_paie",
        label: "Gestion de paie",
        subcategories: []
      },
      {
        id: "formation",
        label: "Formation",
        subcategories: []
      },
      {
        id: "conseil_rh",
        label: "Conseil RH",
        subcategories: []
      },
      {
        id: "externalisation_rh",
        label: "Externalisation RH",
        subcategories: []
      },
      {
        id: "coaching",
        label: "Coaching",
        subcategories: []
      },
      {
        id: "mobilite",
        label: "Mobilité",
        subcategories: []
      },
      {
        id: "droit_travail",
        label: "Droit du travail",
        subcategories: []
      }
    ]
  },
  {
    id: "securite_defense",
    label: "Sécurité / Défense",
    categories: [
      {
        id: "securite_privee",
        label: "Sécurité privée",
        subcategories: []
      },
      {
        id: "gardiennage",
        label: "Gardiennage",
        subcategories: []
      },
      {
        id: "securite_electronique",
        label: "Sécurité électronique",
        subcategories: []
      },
      {
        id: "surveillance",
        label: "Surveillance",
        subcategories: []
      },
      {
        id: "defense",
        label: "Défense",
        subcategories: []
      },
      {
        id: "protection_rapprochee",
        label: "Protection rapprochée",
        subcategories: []
      },
      {
        id: "securite_incendie",
        label: "Sécurité incendie",
        subcategories: []
      }
    ]
  },
  {
    id: "social_insertion_handicap",
    label: "Social / Insertion / Handicap",
    categories: [
      {
        id: "accompagnement",
        label: "Accompagnement",
        subcategories: []
      },
      {
        id: "aide_sociale",
        label: "Aide sociale",
        subcategories: []
      },
      {
        id: "insertion_pro",
        label: "Insertion pro",
        subcategories: []
      }
    ]
  },
  {
    id: "sport_loisirs",
    label: "Sport / Loisirs",
    categories: [
      {
        id: "clubs",
        label: "Clubs",
        subcategories: []
      },
      {
        id: "gestion_equipements",
        label: "Gestion équipements",
        subcategories: []
      }
    ]
  },
  {
    id: "services_aux_entreprises",
    label: "Services aux entreprises",
    categories: [
      {
        id: "proprete_locaux",
        label: "Propreté des locaux",
        subcategories: []
      },
      {
        id: "services_entreprises",
        label: "Services aux entreprises",
        subcategories: []
      },
      {
        id: "desinfection",
        label: "Désinfection",
        subcategories: []
      },
      {
        id: "gestion_dechets",
        label: "Gestion des déchets",
        subcategories: []
      },
      {
        id: "blanchisserie",
        label: "Blanchisserie",
        subcategories: []
      }
    ]
  },
  {
    id: "recrutement_services",
    label: "Recrutement & Services",
    categories: [
      {
        id: "chasse_tetes",
        label: "Chasse de têtes",
        subcategories: []
      },
      {
        id: "portage_salarial",
        label: "Portage salarial",
        subcategories: []
      },
      {
        id: "recrutement_digital",
        label: "Recrutement digital",
        subcategories: []
      },
      {
        id: "talent_acquisition",
        label: "Talent acquisition",
        subcategories: []
      }
    ]
  },
  {
    id: "construction_interieur",
    label: "Construction & Intérieur",
    categories: [
      {
        id: "plafonds",
        label: "Plafonds",
        subcategories: [
          { id: "plafonds_suspendus", label: "Plafonds suspendus" },
          { id: "faux_plafonds_decoratifs", label: "Faux plafonds décoratifs" },
          { id: "peinture_plafond", label: "Peinture de plafond" },
          { id: "plafonds_tendus", label: "Plafonds tendus" }
        ]
      },
      {
        id: "interieur",
        label: "Intérieur",
        subcategories: [
          { id: "portes_interieures", label: "Portes intérieures" },
          { id: "placards_rangements", label: "Placards et rangements" },
          { id: "escaliers_interieurs", label: "Escaliers intérieurs" },
          { id: "parquets_plinthes", label: "Parquets et plinthes" },
          { id: "habillages_divers", label: "Habillages divers" }
        ]
      }
    ]
  },
  {
    id: "technologies",
    label: "Technologies",
    categories: [
      {
        id: "programmation",
        label: "Programmation",
        subcategories: [
          { id: "python", label: "Python" },
          { id: "cpp", label: "C++" },
          { id: "html5", label: "HTML5" }
        ]
      },
      {
        id: "securite_tech",
        label: "Sécurité & Tech",
        subcategories: [
          { id: "cybersecurite", label: "Cybersécurité" },
          { id: "cloud_computing", label: "Cloud computing" },
          { id: "ux_ui", label: "UX/UI" },
          { id: "data", label: "Data" },
          { id: "e_commerce_tech", label: "E-commerce" },
          { id: "reseaux_sociaux", label: "Réseaux sociaux" }
        ]
      }
    ]
  }
];

// Legacy activityTypeOptions for backward compatibility (can be removed later)
export const activityTypeOptions = businessActivityStructure.map(activity => ({
  value: activity.id,
  label: activity.label
}));
  
  // Country codes
  export const countryCodeOptions = [
    { value: "+33", label: "+33 (Fr)" },
    { value: "+32", label: "+32 (Belg)" },
    { value: "+41", label: "+41 (Swi)" },
    { value: "+49", label: "+49 (Ger)" },
    { value: "+39", label: "+39 (Ita)" },
    { value: "+34", label: "+34 (Spa)" },
    { value: "+44", label: "+44 (UK)" },
    { value: "+92", label: "+92 (Pak)" }
  ];
  
  // Service areas for France
  export const serviceAreaOptions = [
    { value: "ambleon_01300", label: "Ambléon (01300)" },
    { value: "labergement_de_varey_01640", label: "L'Abergement-de-Varey (01640)" },
    { value: "amberieu_en_bugey_01500", label: "Ambérieu-en-Bugey (01500)" },
    { value: "amberieux_en_dombes_01330", label: "Ambérieux-en-Dombes (01330)" },
    { value: "ambutrix_01500", label: "Ambutrix (01500)" },
    { value: "andert_et_condon_01300", label: "Andert-et-Condon (01300)" },
    { value: "anglefort_01350", label: "Anglefort (01350)" },
    { value: "apremont_01100", label: "Apremont (01100)" },
    { value: "aranc_01110", label: "Aranc (01110)" },
    { value: "arandas_01230", label: "Arandas (01230)" },
    { value: "arbent_01100", label: "Arbent (01100)" },
    { value: "arbigny_01190", label: "Arbigny (01190)" },
    { value: "arboys_en_bugey_01300", label: "Arboys-en-Bugey (01300)" },
    { value: "argis_01230", label: "Argis (01230)" },
    { value: "armix_01510", label: "Armix (01510)" },
    { value: "ars_sur_formans_01480", label: "Ars-sur-Formans (01480)" },
    { value: "artemare_01510", label: "Artemare (01510)" },
    { value: "asnieres_sur_saone_01570", label: "Asnières-sur-Saône (01570)" },
    { value: "attignat_01340", label: "Attignat (01340)" },
    { value: "bage_dommartin_01380", label: "Bâgé-Dommartin (01380)" },
    { value: "bage_le_chatel_01380", label: "Bâgé-le-Châtel (01380)" },
    { value: "balan_01360", label: "Balan (01360)" },
    { value: "baneins_01990", label: "Baneins (01990)" },
    { value: "beaupont_01270", label: "Beaupont (01270)" },
    { value: "beauregard_01480", label: "Beauregard (01480)" },
    { value: "bellegarde_sur_valserine_01200", label: "Bellegarde-sur-Valserine (01200)" },
    { value: "beligneux_01360", label: "Béli­gnieux (01360)" },
    { value: "belley_01300", label: "Belley (01300)" },
    { value: "belleydoux_01130", label: "Belleydoux (01130)" },
    { value: "bellignat_01810", label: "Bellignat (01810)" },
    { value: "belmont_luthezieu_01260", label: "Belmont-Luthézieu (01260)" },
    { value: "benonces_01470", label: "Bénonces (01470)" },
    { value: "bettant_01500", label: "Bettant (01500)" },
    { value: "bey_01290", label: "Bey (01290)" },
    { value: "beynost_01700", label: "Beynost (01700)" },
    { value: "billiat_01200", label: "Billiat (01200)" },
    { value: "birieux_01330", label: "Birieux (01330)" },
    { value: "biziat_01290", label: "Biziat (01290)" },
    { value: "blyes_01150", label: "Blyes (01150)" },
    { value: "bohas_meyriat_rignat_01250", label: "Bohas-Meyriat-Rignat (01250)" },
    { value: "boissey_01190", label: "Boissey (01190)" },
    { value: "boissey_01380", label: "Boissey (01380)" },
    { value: "bolozon_01450", label: "Bolozon (01450)" },
    { value: "bouligneux_01330", label: "Bouligneux (01330)" },
    { value: "bourg_saint_christophe_01800", label: "Bourg-Saint-Christophe (01800)" },
    { value: "bourg_en_bresse_01000", label: "Bourg-en-Bresse (01000)" },
    { value: "boyeux_saint_jerome_01640", label: "Boyeux-Saint-Jérôme (01640)" },
    { value: "boz_01190", label: "Boz (01190)" },
    { value: "brens_01300", label: "Brens (01300)" },
    { value: "bressolles_01360", label: "Bressolles (01360)" },
    { value: "brion_01460", label: "Brion (01460)" },
    { value: "briord_01470", label: "Briord (01470)" },
    { value: "bregnier_cordon_01300", label: "Brégnier-Cordon (01300)" },
    { value: "brenaz_01260", label: "Brénaz (01260)" },
    { value: "brenod_01110", label: "Brénod (01110)" },
    { value: "buellas_01310", label: "Buellas (01310)" },
    { value: "beard_geovreissiat_01460", label: "Béard-Géovreissiat (01460)" },
    { value: "beligneux_01360", label: "Béligneux (01360)" },
    { value: "benonces_01470", label: "Bénonces (01470)" },
    { value: "beny_01370", label: "Bény (01370)" },
    { value: "beon_01350", label: "Béon (01350)" },
    { value: "bereziat_01340", label: "Béréziat (01340)" },
    { value: "ceignes_01430", label: "Ceignes (01430)" },
    { value: "cerdon_01450", label: "Cerdon (01450)" },
    { value: "certines_01240", label: "Certines (01240)" },
    { value: "cessy_01170", label: "Cessy (01170)" },
    { value: "ceyzeriat_01250", label: "Ceyzériat (01250)" },
    { value: "ceyzerieu_01350", label: "Ceyzérieu (01350)" },
    { value: "chalamont_01320", label: "Chalamont (01320)" },
    { value: "chaleins_01480", label: "Chaleins (01480)" },
    { value: "chaley_01230", label: "Chaley (01230)" },
    { value: "challes_la_montagne_01450", label: "Challes-la-Montagne (01450)" },
    { value: "challex_01630", label: "Challex (01630)" },
    { value: "champagne_en_valromey_01260", label: "Champagne-en-Valromey (01260)" },
    { value: "champdor_corcelles_01110", label: "Champdor-Corcelles (01110)" },
    { value: "champfromier_01410", label: "Champfromier (01410)" },
    { value: "chanay_01420", label: "Chanay (01420)" },
    { value: "chaneins_01990", label: "Chaneins (01990)" },
    { value: "chanoz_chatenay_01400", label: "Chanoz-Châtenay (01400)" },
    { value: "charix_01130", label: "Charix (01130)" },
    { value: "charnoz_sur_ain_01800", label: "Charnoz-sur-Ain (01800)" },
    { value: "chavannes_sur_reyssouze_01190", label: "Chavannes-sur-Reyssouze (01190)" },
    { value: "chaveyriat_01660", label: "Chaveyriat (01660)" },
    { value: "chavornay_01510", label: "Chavornay (01510)" },
    { value: "chazey_bons_01300", label: "Chazey-Bons (01300)" },
    { value: "chazey_sur_ain_01150", label: "Chazey-sur-Ain (01150)" },
    { value: "cheignieu_la_balme_01510", label: "Cheignieu-la-Balme (01510)" },
    { value: "chevillard_01430", label: "Chevillard (01430)" },
    { value: "chevroux_01190", label: "Chevroux (01190)" },
    { value: "chevry_01170", label: "Chevry (01170)" },
    { value: "chateau_gaillard_01500", label: "Château-Gaillard (01500)" },
    { value: "chatenay_01320", label: "Châtenay (01320)" },
    { value: "chatillon_en_michaille_01200", label: "Châtillon-en-Michaille (01200)" },
    { value: "chatillon_la_palud_01320", label: "Châtillon-la-Palud (01320)" },
    { value: "chatillon_sur_chalaronne_01400", label: "Châtillon-sur-Chalaronne (01400)" },
    { value: "chezery_forens_01200", label: "Chézery-Forens (01200)" },
    { value: "civrieux_01390", label: "Civrieux (01390)" },
    { value: "cize_01250", label: "Cize (01250)" },
    { value: "cleyzieu_01230", label: "Cleyzieu (01230)" },
    { value: "coligny_01270", label: "Coligny (01270)" },
    { value: "collonges_01550", label: "Collonges (01550)" },
    { value: "colomieu_01300", label: "Colomieu (01300)" },
    { value: "conand_01230", label: "Conand (01230)" },
    { value: "condamine_01430", label: "Condamine (01430)" },
    { value: "condeissiat_01400", label: "Condeissiat (01400)" },
    { value: "confort_01200", label: "Confort (01200)" },
    { value: "confrancon_01310", label: "Confrançon (01310)" },
    { value: "contrevoz_01300", label: "Contrevoz (01300)" },
    { value: "conzieu_01300", label: "Conzieu (01300)" },
    { value: "corbonod_01420", label: "Corbonod (01420)" },
    { value: "corlier_01110", label: "Corlier (01110)" },
    { value: "cormaranche_en_bugey_01110", label: "Cormaranche-en-Bugey (01110)" },
    { value: "cormoranche_sur_saone_01290", label: "Cormoranche-sur-Saône (01290)" },
    { value: "cormoz_01560", label: "Cormoz (01560)" },
    { value: "corveissiat_01250", label: "Corveissiat (01250)" },
    { value: "courmangoux_01370", label: "Courmangoux (01370)" },
    { value: "courtes_01560", label: "Courtes (01560)" },
    { value: "crans_01320", label: "Crans (01320)" },
    { value: "cras_sur_reyssouze_01340", label: "Cras-sur-Reyssouze (01340)" },
    { value: "cressin_rochefort_01350", label: "Cressin-Rochefort (01350)" },
    { value: "crottet_01750", label: "Crottet (01750)" },
    { value: "crottet_01290", label: "Crottet (01290)" },
    { value: "crozet_01170", label: "Crozet (01170)" },
    { value: "cruzilles_les_mepillat_01290", label: "Cruzilles-lès-Mépillat (01290)" },
    { value: "culoz_01350", label: "Culoz (01350)" },
    { value: "curciat_dongalon_01560", label: "Curciat-Dongalon (01560)" },
    { value: "curtafond_01310", label: "Curtafond (01310)" },
    { value: "cuzieu_01300", label: "Cuzieu (01300)" },
    { value: "dagneux_01120", label: "Dagneux (01120)" },
    { value: "divonne_les_bains_01220", label: "Divonne-les-Bains (01220)" },
    { value: "dommartin_01380", label: "Dommartin (01380)" },
    { value: "dompierre_sur_chalaronne_01400", label: "Dompierre-sur-Chalaronne (01400)" },
    { value: "dompierre_sur_veyle_01240", label: "Dompierre-sur-Veyle (01240)" },
    { value: "domsure_01270", label: "Domsure (01270)" },
    { value: "dortan_01590", label: "Dortan (01590)" },
    { value: "douvres_01500", label: "Douvres (01500)" },
    { value: "drom_01250", label: "Drom (01250)" },
    { value: "druillat_01160", label: "Druillat (01160)" },
    { value: "faramans_01800", label: "Faramans (01800)" },
    { value: "fareins_01480", label: "Fareins (01480)" },
    { value: "farges_01550", label: "Farges (01550)" },
    { value: "feillens_01570", label: "Feillens (01570)" },
    { value: "ferney_voltaire_01210", label: "Ferney-Voltaire (01210)" },
    { value: "flaxieu_01350", label: "Flaxieu (01350)" },
    { value: "foissiat_01340", label: "Foissiat (01340)" },
    { value: "francheleins_01090", label: "Francheleins (01090)" },
    { value: "frans_01480", label: "Frans (01480)" },
    { value: "garnerans_01140", label: "Garnerans (01140)" },
    { value: "genouilleux_01090", label: "Genouilleux (01090)" },
    { value: "germagnat_01250", label: "Germagnat (01250)" },
    { value: "gex_01170", label: "Gex (01170)" },
    { value: "giron_01130", label: "Giron (01130)" },
    { value: "gorrevod_01190", label: "Gorrevod (01190)" },
    { value: "grand_corent_01250", label: "Grand-Corent (01250)" },
    { value: "grilly_01220", label: "Grilly (01220)" },
    { value: "grieges_01290", label: "Grièges (01290)" },
    { value: "groissiat_01100", label: "Groissiat (01100)" },
    { value: "groslee_saint_benoit_01300", label: "Groslée-Saint-Benoit (01300)" },
    { value: "groslee_saint_benoit_01680", label: "Groslée-Saint-Benoit (01680)" },
    { value: "guereins_01090", label: "Guéreins (01090)" },
    { value: "geovreisset_01100", label: "Géovreisset (01100)" },
    { value: "haut_valromey_01260", label: "Haut Valromey (01260)" },
    { value: "hautecourt_romaneche_01250", label: "Hautecourt-Romanèche (01250)" },
    { value: "hauteville_lompnes_01110", label: "Hauteville-Lompnes (01110)" },
    { value: "hostiaz_01110", label: "Hostiaz (01110)" },
    { value: "illiat_01140", label: "Illiat (01140)" },
    { value: "injoux_genissiat_01200", label: "Injoux-Génissiat (01200)" },
    { value: "innimond_01680", label: "Innimond (01680)" },
    { value: "izenave_01430", label: "Izenave (01430)" },
    { value: "izernore_01580", label: "Izernore (01580)" },
    { value: "izieu_01300", label: "Izieu (01300)" },
    { value: "jassans_riottier_01480", label: "Jassans-Riottier (01480)" },
    { value: "jasseron_01250", label: "Jasseron (01250)" },
    { value: "jayat_01340", label: "Jayat (01340)" },
    { value: "journans_01250", label: "Journans (01250)" },
    { value: "joyeux_01800", label: "Joyeux (01800)" },
    { value: "jujurieux_01640", label: "Jujurieux (01640)" },
    { value: "labergement_clemenciat_01400", label: "L'Abergement-Clémenciat (01400)" },
    { value: "la_boisse_01120", label: "La Boisse (01120)" },
    { value: "la_burbanche_01510", label: "La Burbanche (01510)" },
    { value: "la_chapelle_du_chatelard_01240", label: "La Chapelle-du-Châtelard (01240)" },
    { value: "la_trancliere_01160", label: "La Tranclière (01160)" },
    { value: "labalme_01450", label: "Labalme (01450)" },
    { value: "lagnieu_01150", label: "Lagnieu (01150)" },
    { value: "laiz_01290", label: "Laiz (01290)" },
    { value: "lancrans_01200", label: "Lancrans (01200)" },
    { value: "lantenay_01430", label: "Lantenay (01430)" },
    { value: "lapeyrouse_01330", label: "Lapeyrouse (01330)" },
    { value: "lavours_01350", label: "Lavours (01350)" },
    { value: "le_montellier_01800", label: "Le Montellier (01800)" },
    { value: "le_plantay_01330", label: "Le Plantay (01330)" },
    { value: "le_poizat_lalleyriat_01130", label: "Le Poizat-Lalleyriat (01130)" },
    { value: "lent_01240", label: "Lent (01240)" },
    { value: "les_neyrolles_01130", label: "Les Neyrolles (01130)" },
    { value: "lescheroux_01560", label: "Lescheroux (01560)" },
    { value: "leyment_01150", label: "Leyment (01150)" },
    { value: "leyssard_01450", label: "Leyssard (01450)" },
    { value: "lhuis_01680", label: "Lhuis (01680)" },
    { value: "lhopital_01420", label: "Lhôpital (01420)" },
    { value: "lochieu_01260", label: "Lochieu (01260)" },
    { value: "lompnas_01680", label: "Lompnas (01680)" },
    { value: "lompnieu_01260", label: "Lompnieu (01260)" },
    { value: "loyettes_01360", label: "Loyettes (01360)" },
    { value: "lurcy_01090", label: "Lurcy (01090)" },
    { value: "leaz_01200", label: "Léaz (01200)" },
    { value: "lelex_01410", label: "Lélex (01410)" },
    { value: "magnieu_01300", label: "Magnieu (01300)" },
    { value: "maillat_01430", label: "Maillat (01430)" },
    { value: "malafretaz_01340", label: "Malafretaz (01340)" },
    { value: "mantenay_montlin_01560", label: "Mantenay-Montlin (01560)" },
    { value: "manziat_01570", label: "Manziat (01570)" },
    { value: "marboz_01851", label: "Marboz (01851)" },
    { value: "marchamp_01680", label: "Marchamp (01680)" },
    { value: "marignieu_01300", label: "Marignieu (01300)" },
    { value: "marlieux_01240", label: "Marlieux (01240)" },
    { value: "marsonnas_01340", label: "Marsonnas (01340)" },
    { value: "martignat_01100", label: "Martignat (01100)" },
    { value: "massieux_01600", label: "Massieux (01600)" },
    { value: "massignieu_de_rives_01300", label: "Massignieu-de-Rives (01300)" },
    { value: "matafelon_granges_01580", label: "Matafelon-Granges (01580)" },
    { value: "meillonnas_01370", label: "Meillonnas (01370)" },
    { value: "messimy_sur_saone_01480", label: "Messimy-sur-Saône (01480)" },
    { value: "meximieux_01800", label: "Meximieux (01800)" },
    { value: "mijoux_01170", label: "Mijoux (01170)" },
    { value: "mijoux_01410", label: "Mijoux (01410)" },
    { value: "mionnay_01390", label: "Mionnay (01390)" },
    { value: "miribel_01700", label: "Miribel (01700)" },
    { value: "miserieux_01600", label: "Misérieux (01600)" },
    { value: "mogneneins_01140", label: "Mogneneins (01140)" },
    { value: "montagnat_01250", label: "Montagnat (01250)" },
    { value: "montagnieu_01470", label: "Montagnieu (01470)" },
    { value: "montanges_01200", label: "Montanges (01200)" },
    { value: "montceaux_01090", label: "Montceaux (01090)" },
    { value: "montcet_01310", label: "Montcet (01310)" },
    { value: "monthieux_01390", label: "Monthieux (01390)" },
    { value: "montluel_01120", label: "Montluel (01120)" },
    { value: "montmerle_sur_saone_01090", label: "Montmerle-sur-Saône (01090)" },
    { value: "montracol_01310", label: "Montracol (01310)" },
    { value: "montrevel_en_bresse_01340", label: "Montrevel-en-Bresse (01340)" },
    { value: "montreal_la_cluse_01460", label: "Montréal-la-Cluse (01460)" },
    { value: "murs_et_gelignieux_01300", label: "Murs-et-Gélignieux (01300)" },
    { value: "merignat_01450", label: "Mérignat (01450)" },
    { value: "mezeriat_01660", label: "Mézériat (01660)" },
    { value: "nantua_01130", label: "Nantua (01130)" },
    { value: "nantua_01460", label: "Nantua (01460)" },
    { value: "neuville_les_dames_01400", label: "Neuville-les-Dames (01400)" },
    { value: "neuville_sur_ain_01160", label: "Neuville-sur-Ain (01160)" },
    { value: "neyron_01700", label: "Neyron (01700)" },
    { value: "nivigne_et_suran_01250", label: "Nivigne et Suran (01250)" },
    { value: "nivollet_montgriffon_01230", label: "Nivollet-Montgriffon (01230)" },
    { value: "nievroz_01120", label: "Niévroz (01120)" },
    { value: "nurieux_volognat_01460", label: "Nurieux-Volognat (01460)" },
    { value: "oncieu_01230", label: "Oncieu (01230)" },
    { value: "ordonnaz_01510", label: "Ordonnaz (01510)" },
    { value: "ornex_01210", label: "Ornex (01210)" },
    { value: "outriaz_01430", label: "Outriaz (01430)" },
    { value: "oyonnax_01100", label: "Oyonnax (01100)" },
    { value: "ozan_01190", label: "Ozan (01190)" },
    { value: "parcieux_01600", label: "Parcieux (01600)" },
    { value: "parves_et_nattages_01300", label: "Parves et Nattages (01300)" },
    { value: "perrex_01540", label: "Perrex (01540)" },
    { value: "peyriat_01430", label: "Peyriat (01430)" },
    { value: "peyrieu_01300", label: "Peyrieu (01300)" },
    { value: "peyzieux_sur_saone_01140", label: "Peyzieux-sur-Saône (01140)" },
    { value: "pirajoux_01270", label: "Pirajoux (01270)" },
    { value: "pizay_01120", label: "Pizay (01120)" },
    { value: "plagne_01130", label: "Plagne (01130)" },
    { value: "polliat_01310", label: "Polliat (01310)" },
    { value: "pollieu_01350", label: "Pollieu (01350)" },
    { value: "poncin_01450", label: "Poncin (01450)" },
    { value: "pont_d_ain_01160", label: "Pont-d'Ain (01160)" },
    { value: "pont_de_vaux_01190", label: "Pont-de-Vaux (01190)" },
    { value: "pont_de_veyle_01290", label: "Pont-de-Veyle (01290)" },
    { value: "port_01460", label: "Port (01460)" },
    { value: "pougny_01550", label: "Pougny (01550)" },
    { value: "pouillat_01250", label: "Pouillat (01250)" },
    { value: "priay_01160", label: "Priay (01160)" },
    { value: "premeyzel_01300", label: "Prémeyzel (01300)" },
    { value: "premillieu_01110", label: "Prémillieu (01110)" },
    { value: "prevessin_moens_01280", label: "Prévessin-Moëns (01280)" },
    { value: "pugieu_01510", label: "Pugieu (01510)" },
    { value: "peron_01630", label: "Péron (01630)" },
    { value: "peronnas_01960", label: "Péronnas (01960)" },
    { value: "perouges_01800", label: "Pérouges (01800)" },
    { value: "ramasse_01250", label: "Ramasse (01250)" },
    { value: "rance_01390", label: "Rancé (01390)" },
    { value: "relevant_01990", label: "Relevant (01990)" },
    { value: "replonges_01750", label: "Replonges (01750)" },
    { value: "revonnas_01250", label: "Revonnas (01250)" },
    { value: "reyrieux_01600", label: "Reyrieux (01600)" },
    { value: "reyssouze_01190", label: "Reyssouze (01190)" },
    { value: "rignieux_le_franc_01800", label: "Rignieux-le-Franc (01800)" },
    { value: "romans_01400", label: "Romans (01400)" },
    { value: "rossillon_01510", label: "Rossillon (01510)" },
    { value: "ruffieu_01260", label: "Ruffieu (01260)" },
    { value: "saint_alban_01450", label: "Saint-Alban (01450)" },
    { value: "saint_andre_d_huiriat_01290", label: "Saint-André-d'Huiriat (01290)" },
    { value: "saint_andre_de_bage_01380", label: "Saint-André-de-Bâgé (01380)" },
    { value: "saint_andre_de_corcy_01390", label: "Saint-André-de-Corcy (01390)" },
    { value: "saint_andre_le_bouchoux_01240", label: "Saint-André-le-Bouchoux (01240)" },
    { value: "saint_andre_sur_vieux_jonc_01960", label: "Saint-André-sur-Vieux-Jonc (01960)" },
    { value: "saint_bernard_01600", label: "Saint-Bernard (01600)" },
    { value: "saint_benigne_01190", label: "Saint-Bénigne (01190)" },
    { value: "saint_champ_01300", label: "Saint-Champ (01300)" },
    { value: "saint_cyr_sur_menthon_01380", label: "Saint-Cyr-sur-Menthon (01380)" },
    { value: "saint_denis_en_bugey_01500", label: "Saint-Denis-en-Bugey (01500)" },
    { value: "saint_denis_les_bourg_01000", label: "Saint-Denis-lès-Bourg (01000)" },
    { value: "saint_didier_d_aussiat_01340", label: "Saint-Didier-d'Aussiat (01340)" },
    { value: "saint_didier_de_formans_01600", label: "Saint-Didier-de-Formans (01600)" },
    { value: "saint_didier_sur_chalaronne_01140", label: "Saint-Didier-sur-Chalaronne (01140)" },
    { value: "saint_genis_pouilly_01630", label: "Saint-Genis-Pouilly (01630)" },
    { value: "saint_genis_sur_menthon_01380", label: "Saint-Genis-sur-Menthon (01380)" },
    { value: "saint_georges_sur_renon_01400", label: "Saint-Georges-sur-Renon (01400)" },
    { value: "saint_germain_de_joux_01130", label: "Saint-Germain-de-Joux (01130)" },
    { value: "saint_germain_les_paroisses_01300", label: "Saint-Germain-les-Paroisses (01300)" },
    { value: "saint_germain_sur_renon_01240", label: "Saint-Germain-sur-Renon (01240)" },
    { value: "saint_jean_de_gonville_01630", label: "Saint-Jean-de-Gonville (01630)" },
    { value: "saint_jean_de_niost_01800", label: "Saint-Jean-de-Niost (01800)" },
    { value: "saint_jean_de_thurigneux_01390", label: "Saint-Jean-de-Thurigneux (01390)" },
    { value: "saint_jean_le_vieux_01640", label: "Saint-Jean-le-Vieux (01640)" },
    { value: "saint_jean_sur_reyssouze_01560", label: "Saint-Jean-sur-Reyssouze (01560)" },
    { value: "saint_jean_sur_veyle_01290", label: "Saint-Jean-sur-Veyle (01290)" },
    { value: "saint_julien_sur_reyssouze_01560", label: "Saint-Julien-sur-Reyssouze (01560)" },
    { value: "saint_julien_sur_veyle_01540", label: "Saint-Julien-sur-Veyle (01540)" },
    { value: "saint_just_01250", label: "Saint-Just (01250)" },
    { value: "saint_laurent_sur_saone_01750", label: "Saint-Laurent-sur-Saône (01750)" },
    { value: "saint_marcel_01390", label: "Saint-Marcel (01390)" },
    { value: "saint_martin_de_bavel_01510", label: "Saint-Martin-de-Bavel (01510)" },
    { value: "saint_martin_du_frene_01430", label: "Saint-Martin-du-Frêne (01430)" },
    { value: "saint_martin_du_mont_01160", label: "Saint-Martin-du-Mont (01160)" },
    { value: "saint_martin_le_chatel_01310", label: "Saint-Martin-le-Châtel (01310)" },
    { value: "saint_maurice_de_beynost_01700", label: "Saint-Maurice-de-Beynost (01700)" },
    { value: "saint_maurice_de_gourdans_01800", label: "Saint-Maurice-de-Gourdans (01800)" },
    { value: "saint_maurice_de_remens_01500", label: "Saint-Maurice-de-Rémens (01500)" },
    { value: "saint_nizier_le_bouchoux_01560", label: "Saint-Nizier-le-Bouchoux (01560)" },
    { value: "saint_nizier_le_desert_01320", label: "Saint-Nizier-le-Désert (01320)" },
    { value: "saint_paul_de_varax_01240", label: "Saint-Paul-de-Varax (01240)" },
    { value: "saint_rambert_en_bugey_01230", label: "Saint-Rambert-en-Bugey (01230)" },
    { value: "saint_remy_01310", label: "Saint-Rémy (01310)" },
    { value: "saint_sorlin_en_bugey_01150", label: "Saint-Sorlin-en-Bugey (01150)" },
    { value: "saint_sulpice_01340", label: "Saint-Sulpice (01340)" },
    { value: "saint_trivier_de_courtes_01560", label: "Saint-Trivier-de-Courtes (01560)" },
    { value: "saint_trivier_sur_moignans_01990", label: "Saint-Trivier-sur-Moignans (01990)" },
    { value: "saint_vulbas_01150", label: "Saint-Vulbas (01150)" },
    { value: "saint_eloi_01800", label: "Saint-Éloi (01800)" },
    { value: "saint_etienne_du_bois_01370", label: "Saint-Étienne-du-Bois (01370)" },
    { value: "saint_etienne_sur_chalaronne_01140", label: "Saint-Étienne-sur-Chalaronne (01140)" },
    { value: "saint_etienne_sur_reyssouze_01190", label: "Saint-Étienne-sur-Reyssouze (01190)" },
    { value: "sainte_croix_01120", label: "Sainte-Croix (01120)" },
    { value: "sainte_euphemie_01600", label: "Sainte-Euphémie (01600)" },
    { value: "sainte_julie_01150", label: "Sainte-Julie (01150)" },
    { value: "sainte_olive_01330", label: "Sainte-Olive (01330)" },
    { value: "salavre_01270", label: "Salavre (01270)" },
    { value: "samognat_01580", label: "Samognat (01580)" },
    { value: "sandrans_01400", label: "Sandrans (01400)" },
    { value: "sault_brenaz_01150", label: "Sault-Brénaz (01150)" },
    { value: "sauverny_01220", label: "Sauverny (01220)" },
    { value: "savigneux_01480", label: "Savigneux (01480)" },
    { value: "seillonnaz_01470", label: "Seillonnaz (01470)" },
    { value: "sergy_01630", label: "Sergy (01630)" },
    { value: "sermoyer_01190", label: "Sermoyer (01190)" },
    { value: "serrieres_de_briord_01470", label: "Serrières-de-Briord (01470)" },
    { value: "serrieres_sur_ain_01450", label: "Serrières-sur-Ain (01450)" },
    { value: "servas_01960", label: "Servas (01960)" },
    { value: "servignat_01560", label: "Servignat (01560)" },
    { value: "seyssel_01420", label: "Seyssel (01420)" },
    { value: "simandre_sur_suran_01250", label: "Simandre-sur-Suran (01250)" },
    { value: "sonthonnax_la_montagne_01580", label: "Sonthonnax-la-Montagne (01580)" },
    { value: "souclin_01150", label: "Souclin (01150)" },
    { value: "sulignat_01400", label: "Sulignat (01400)" },
    { value: "surjoux_01420", label: "Surjoux (01420)" },
    { value: "sutrieu_01260", label: "Sutrieu (01260)" },
    { value: "segny_01170", label: "Ségny (01170)" },
    { value: "talissieu_01510", label: "Talissieu (01510)" },
    { value: "tenay_01230", label: "Tenay (01230)" },
    { value: "thil_01120", label: "Thil (01120)" },
    { value: "thoiry_01710", label: "Thoiry (01710)" },
    { value: "thoissey_01140", label: "Thoissey (01140)" },
    { value: "thezillieu_01110", label: "Thézillieu (01110)" },
    { value: "torcieu_01230", label: "Torcieu (01230)" },
    { value: "tossiat_01250", label: "Tossiat (01250)" },
    { value: "toussieux_01600", label: "Toussieux (01600)" },
    { value: "tramoyes_01390", label: "Tramoyes (01390)" },
    { value: "trevoux_01600", label: "Trévoux (01600)" },
    { value: "val_revermont_01370", label: "Val-Revermont (01370)" },
    { value: "valeins_01140", label: "Valeins (01140)" },
    { value: "vandeins_01660", label: "Vandeins (01660)" },
    { value: "varambon_01160", label: "Varambon (01160)" },
    { value: "vaux_en_bugey_01150", label: "Vaux-en-Bugey (01150)" },
    { value: "verjon_01270", label: "Verjon (01270)" },
    { value: "vernoux_01560", label: "Vernoux (01560)" },
    { value: "versailleux_01330", label: "Versailleux (01330)" },
    { value: "versonnex_01210", label: "Versonnex (01210)" },
    { value: "vesancy_01170", label: "Vesancy (01170)" },
    { value: "vescours_01560", label: "Vescours (01560)" },
    { value: "vieu_01260", label: "Vieu (01260)" },
    { value: "vieu_d_izenave_01430", label: "Vieu-d'Izenave (01430)" },
    { value: "villars_les_dombes_01330", label: "Villars-les-Dombes (01330)" },
    { value: "villebois_01150", label: "Villebois (01150)" },
    { value: "villemotier_01270", label: "Villemotier (01270)" },
    { value: "villeneuve_01480", label: "Villeneuve (01480)" },
    { value: "villereversure_01250", label: "Villereversure (01250)" },
    { value: "villes_01200", label: "Villes (01200)" },
    { value: "villette_sur_ain_01320", label: "Villette-sur-Ain (01320)" },
    { value: "villieu_loyes_mollon_01800", label: "Villieu-Loyes-Mollon (01800)" },
    { value: "viriat_01440", label: "Viriat (01440)" },
    { value: "virieu_le_grand_01510", label: "Virieu-le-Grand (01510)" },
    { value: "virieu_le_petit_01260", label: "Virieu-le-Petit (01260)" },
    { value: "virignin_01300", label: "Virignin (01300)" },
    { value: "vongnes_01350", label: "Vongnes (01350)" },
    { value: "vonnas_01540", label: "Vonnas (01540)" },
    { value: "vesines_01570", label: "Vésines (01570)" },
    { value: "echallon_01130", label: "Échallon (01130)" },
    { value: "echenevex_01170", label: "Échenevex (01170)" },
    { value: "etrez_01340", label: "Étrez (01340)" },
    { value: "evosges_01230", label: "Évosges (01230)" },
    { value: "abrest_03200", label: "Abrest (03200)" },
    { value: "agonges_03210", label: "Agonges (03210)" },
    { value: "ainay_le_chateau_03360", label: "Ainay-le-Château (03360)" },
    { value: "andelaroche_03120", label: "Andelaroche (03120)" },
    { value: "archignat_03380", label: "Archignat (03380)" },
    { value: "arfeuilles_03120", label: "Arfeuilles (03120)" },
    { value: "arpheuilles_saint_priest_03420", label: "Arpheuilles-Saint-Priest (03420)" },
    { value: "arronnes_03250", label: "Arronnes (03250)" },
    { value: "aubigny_03460", label: "Aubigny (03460)" },
    { value: "audes_03190", label: "Audes (03190)" },
    { value: "aurouer_03460", label: "Aurouër (03460)" },
    { value: "autry_issards_03210", label: "Autry-Issards (03210)" },
    { value: "avermes_03000", label: "Avermes (03000)" },
    { value: "avrilly_03130", label: "Avrilly (03130)" },
    { value: "bagneux_03460", label: "Bagneux (03460)" },
    { value: "barberier_03140", label: "Barberier (03140)" },
    { value: "barrais_bussolles_03120", label: "Barrais-Bussolles (03120)" },
    { value: "bayet_03500", label: "Bayet (03500)" },
    { value: "beaulon_03230", label: "Beaulon (03230)" },
    { value: "beaune_d_allier_03390", label: "Beaune-d'Allier (03390)" },
    { value: "bellenaves_03330", label: "Bellenaves (03330)" },
    { value: "bellerive_sur_allier_03700", label: "Bellerive-sur-Allier (03700)" },
    { value: "bert_03130", label: "Bert (03130)" },
    { value: "bessay_sur_allier_03340", label: "Bessay-sur-Allier (03340)" },
    { value: "besson_03210", label: "Besson (03210)" },
    { value: "billezois_03120", label: "Billezois (03120)" },
    { value: "billy_03260", label: "Billy (03260)" },
    { value: "biozat_03800", label: "Biozat (03800)" },
    { value: "bizeneuille_03170", label: "Bizeneuille (03170)" },
    { value: "blomard_03390", label: "Blomard (03390)" },
    { value: "bost_03300", label: "Bost (03300)" },
    { value: "bouce_03150", label: "Boucé (03150)" },
    { value: "bourbon_l_archambault_03160", label: "Bourbon-l'Archambault (03160)" },
    { value: "braize_03360", label: "Braize (03360)" },
    { value: "bransat_03500", label: "Bransat (03500)" },
    { value: "bresnay_03210", label: "Bresnay (03210)" },
    { value: "bressolles_03000", label: "Bressolles (03000)" },
    { value: "brout_vernet_03110", label: "Broût-Vernet (03110)" },
    { value: "brugheas_03700", label: "Brugheas (03700)" },
    { value: "busset_03270", label: "Busset (03270)" },
    { value: "buxieres_les_mines_03440", label: "Buxières-les-Mines (03440)" },
    { value: "begues_03800", label: "Bègues (03800)" },
    { value: "bezenet_03170", label: "Bézenet (03170)" },
    { value: "cesset_03500", label: "Cesset (03500)" },
    { value: "chamblet_03170", label: "Chamblet (03170)" },
    { value: "chamberat_03370", label: "Chambérat (03370)" },
    { value: "chantelle_03140", label: "Chantelle (03140)" },
    { value: "chapeau_03340", label: "Chapeau (03340)" },
    { value: "chappes_03390", label: "Chappes (03390)" },
    { value: "chareil_cintrat_03140", label: "Chareil-Cintrat (03140)" },
    { value: "charmeil_03110", label: "Charmeil (03110)" },
    { value: "charmes_03800", label: "Charmes (03800)" },
    { value: "charroux_03140", label: "Charroux (03140)" },
    { value: "chassenard_03510", label: "Chassenard (03510)" },
    { value: "chavenon_03440", label: "Chavenon (03440)" },
    { value: "chavroches_03220", label: "Chavroches (03220)" },
    { value: "chazemais_03370", label: "Chazemais (03370)" },
    { value: "chemilly_03210", label: "Chemilly (03210)" },
    { value: "chevagnes_03230", label: "Chevagnes (03230)" },
    { value: "chezelle_03140", label: "Chezelle (03140)" },
    { value: "chirat_l_eglise_03330", label: "Chirat-l'Église (03330)" },
    { value: "chouvigy_03450", label: "Chouvigy (03450)" },
    { value: "chateau_sur_allier_03320", label: "Château-sur-Allier (03320)" },
    { value: "chatel_montagne_03250", label: "Châtel-Montagne (03250)" },
    { value: "chatel_de_neuvre_03500", label: "Châtel-de-Neuvre (03500)" },
    { value: "chatelperron_03220", label: "Châtelperron (03220)" },
    { value: "chatelus_03120", label: "Châtelus (03120)" },
    { value: "chatillon_03210", label: "Châtillon (03210)" },
    { value: "chezy_03230", label: "Chézy (03230)" },
    { value: "cindre_03220", label: "Cindré (03220)" },
    { value: "cognat_lyonne_03110", label: "Cognat-Lyonne (03110)" },
    { value: "colombier_03600", label: "Colombier (03600)" },
    { value: "commentry_03600", label: "Commentry (03600)" },
    { value: "contigny_03500", label: "Contigny (03500)" },
    { value: "cosne_d_allier_03430", label: "Cosne-d'Allier (03430)" },
    { value: "coulandon_03000", label: "Coulandon (03000)" },
    { value: "coulanges_03470", label: "Coulanges (03470)" },
    { value: "couleuvre_03320", label: "Couleuvre (03320)" },
    { value: "courcais_03370", label: "Courçais (03370)" },
    { value: "coutansouze_03330", label: "Coutansouze (03330)" },
    { value: "couzon_03160", label: "Couzon (03160)" },
    { value: "cressanges_03240", label: "Cressanges (03240)" },
    { value: "creuzier_le_neuf_03300", label: "Creuzier-le-Neuf (03300)" },
    { value: "creuzier_le_vieux_03300", label: "Creuzier-le-Vieux (03300)" },
    { value: "crechy_03150", label: "Créchy (03150)" },
    { value: "cusset_03300", label: "Cusset (03300)" },
    { value: "cerilly_03350", label: "Cérilly (03350)" },
    { value: "deneuille_les_mines_03170", label: "Deneuille-les-Mines (03170)" },
    { value: "deneuille_les_chantelle_03140", label: "Deneuille-lès-Chantelle (03140)" },
    { value: "deux_chaises_03240", label: "Deux-Chaises (03240)" },
    { value: "diou_03290", label: "Diou (03290)" },
    { value: "dompierre_sur_besbre_03290", label: "Dompierre-sur-Besbre (03290)" },
    { value: "domerat_03410", label: "Domérat (03410)" },
    { value: "doyet_03170", label: "Doyet (03170)" },
    { value: "droiturier_03120", label: "Droiturier (03120)" },
    { value: "durdat_larequille_03310", label: "Durdat-Larequille (03310)" },
    { value: "desertines_03630", label: "Désertines (03630)" },
    { value: "escurolles_03110", label: "Escurolles (03110)" },
    { value: "espinasse_vozelle_03110", label: "Espinasse-Vozelle (03110)" },
    { value: "estivareilles_03190", label: "Estivareilles (03190)" },
    { value: "ferrieres_sur_sichon_03250", label: "Ferrières-sur-Sichon (03250)" },
    { value: "fleuriel_03140", label: "Fleuriel (03140)" },
    { value: "fourilles_03140", label: "Fourilles (03140)" },
    { value: "franchesse_03160", label: "Franchesse (03160)" },
    { value: "gannat_03800", label: "Gannat (03800)" },
    { value: "gannay_sur_loire_03230", label: "Gannay-sur-Loire (03230)" },
    { value: "garnat_sur_engievre_03230", label: "Garnat-sur-Engièvre (03230)" },
    { value: "gennetines_03400", label: "Gennetines (03400)" },
    { value: "gipcy_03210", label: "Gipcy (03210)" },
    { value: "gouise_03340", label: "Gouise (03340)" },
    { value: "haut_bocage_03190", label: "Haut-Bocage (03190)" },
    { value: "hauterive_03270", label: "Hauterive (03270)" },
    { value: "huriel_03380", label: "Huriel (03380)" },
    { value: "hyds_03600", label: "Hyds (03600)" },
    { value: "herisson_03190", label: "Hérisson (03190)" },
    { value: "isle_et_bardais_03360", label: "Isle-et-Bardais (03360)" },
    { value: "isserpent_03120", label: "Isserpent (03120)" },
    { value: "jaligny_sur_besbre_03220", label: "Jaligny-sur-Besbre (03220)" },
    { value: "jenzat_03800", label: "Jenzat (03800)" },
    { value: "la_celle_03600", label: "La Celle (03600)" },
    { value: "la_chabanne_03250", label: "La Chabanne (03250)" },
    { value: "la_chapelaude_03380", label: "La Chapelaude (03380)" },
    { value: "la_chapelle_03300", label: "La Chapelle (03300)" },
    { value: "la_chapelle_aux_chasses_03230", label: "La Chapelle-aux-Chasses (03230)" },
    { value: "la_ferte_hauterive_03340", label: "La Ferté-Hauterive (03340)" },
    { value: "la_guillermie_03250", label: "La Guillermie (03250)" },
    { value: "la_petite_marche_03420", label: "La Petite-Marche (03420)" },
    { value: "lafeline_03500", label: "Laféline (03500)" },
    { value: "lalizolle_03450", label: "Lalizolle (03450)" },
    { value: "lamaids_03380", label: "Lamaids (03380)" },
    { value: "langy_03150", label: "Langy (03150)" },
    { value: "lapalisse_03120", label: "Lapalisse (03120)" },
    { value: "laprugne_03250", label: "Laprugne (03250)" },
    { value: "lavault_sainte_anne_03100", label: "Lavault-Sainte-Anne (03100)" },
    { value: "lavoine_03250", label: "Lavoine (03250)" },
    { value: "le_bouchaud_03130", label: "Le Bouchaud (03130)" },
    { value: "le_brethon_03350", label: "Le Brethon (03350)" },
    { value: "le_breuil_03120", label: "Le Breuil (03120)" },
    { value: "le_donjon_03130", label: "Le Donjon (03130)" },
    { value: "le_mayet_d_ecole_03800", label: "Le Mayet-d'École (03800)" },
    { value: "le_mayet_de_montagne_03250", label: "Le Mayet-de-Montagne (03250)" },
    { value: "le_montet_03240", label: "Le Montet (03240)" },
    { value: "le_pin_03130", label: "Le Pin (03130)" },
    { value: "le_theil_03240", label: "Le Theil (03240)" },
    { value: "le_vernet_03200", label: "Le Vernet (03200)" },
    { value: "le_veurdre_03320", label: "Le Veurdre (03320)" },
    { value: "le_vilhain_03350", label: "Le Vilhain (03350)" },
    { value: "lenax_03130", label: "Lenax (03130)" },
    { value: "liernolles_03130", label: "Liernolles (03130)" },
    { value: "lignerolles_03410", label: "Lignerolles (03410)" },
    { value: "limoise_03320", label: "Limoise (03320)" },
    { value: "loddes_03130", label: "Loddes (03130)" },
    { value: "loriges_03500", label: "Loriges (03500)" },
    { value: "louchy_montfand_03500", label: "Louchy-Montfand (03500)" },
    { value: "louroux_bourbonnais_03350", label: "Louroux-Bourbonnais (03350)" },
    { value: "louroux_de_beaune_03600", label: "Louroux-de-Beaune (03600)" },
    { value: "louroux_de_bouble_03330", label: "Louroux-de-Bouble (03330)" },
    { value: "luneau_03130", label: "Luneau (03130)" },
    { value: "lurcy_levis_03320", label: "Lurcy-Lévis (03320)" },
    { value: "lusigny_03230", label: "Lusigny (03230)" },
    { value: "letelon_03360", label: "Lételon (03360)" },
    { value: "magnet_03260", label: "Magnet (03260)" },
    { value: "malicorne_03600", label: "Malicorne (03600)" },
    { value: "marcenat_03260", label: "Marcenat (03260)" },
    { value: "marcillat_en_combraille_03420", label: "Marcillat-en-Combraille (03420)" },
    { value: "marigny_03210", label: "Marigny (03210)" },
    { value: "mariol_03270", label: "Mariol (03270)" },
    { value: "mazerier_03800", label: "Mazerier (03800)" },
    { value: "mazirat_03420", label: "Mazirat (03420)" },
    { value: "meaulne_vitray_03360", label: "Meaulne-Vitray (03360)" },
    { value: "meillard_03500", label: "Meillard (03500)" },
    { value: "meillers_03210", label: "Meillers (03210)" },
    { value: "mercy_03340", label: "Mercy (03340)" },
    { value: "mesples_03370", label: "Mesples (03370)" },
    { value: "molinet_03510", label: "Molinet (03510)" },
    { value: "molles_03300", label: "Molles (03300)" },
    { value: "monestier_03140", label: "Monestier (03140)" },
    { value: "montaigu_le_blin_03150", label: "Montaigu-le-Blin (03150)" },
    { value: "montaiguet_en_forez_03130", label: "Montaiguët-en-Forez (03130)" },
    { value: "montbeugny_03340", label: "Montbeugny (03340)" },
    { value: "montcombroux_les_mines_03130", label: "Montcombroux-les-Mines (03130)" },
    { value: "monteignet_sur_l_andelot_03800", label: "Monteignet-sur-l'Andelot (03800)" },
    { value: "montilly_03000", label: "Montilly (03000)" },
    { value: "montlucon_03100", label: "Montluçon (03100)" },
    { value: "montmarault_03390", label: "Montmarault (03390)" },
    { value: "montoldre_03150", label: "Montoldre (03150)" },
    { value: "montord_03500", label: "Montord (03500)" },
    { value: "montvicq_03170", label: "Montvicq (03170)" },
    { value: "monetay_sur_allier_03500", label: "Monétay-sur-Allier (03500)" },
    { value: "monetay_sur_loire_03470", label: "Monétay-sur-Loire (03470)" },
    { value: "moulins_03000", label: "Moulins (03000)" },
    { value: "murat_03390", label: "Murat (03390)" },
    { value: "nades_03450", label: "Nades (03450)" },
    { value: "nassigny_03190", label: "Nassigny (03190)" },
    { value: "naves_03330", label: "Naves (03330)" },
    { value: "neuilly_en_donjon_03130", label: "Neuilly-en-Donjon (03130)" },
    { value: "neuilly_le_real_03340", label: "Neuilly-le-Réal (03340)" },
    { value: "neure_03320", label: "Neure (03320)" },
    { value: "neuvy_03000", label: "Neuvy (03000)" },
    { value: "nizerolles_03250", label: "Nizerolles (03250)" },
    { value: "noyant_d_allier_03210", label: "Noyant-d'Allier (03210)" },
    { value: "neris_les_bains_03310", label: "Néris-les-Bains (03310)" },
    { value: "paray_le_fresil_03230", label: "Paray-le-Frésil (03230)" },
    { value: "paray_sous_briailles_03500", label: "Paray-sous-Briailles (03500)" },
    { value: "pierrefitte_sur_loire_03470", label: "Pierrefitte-sur-Loire (03470)" },
    { value: "pouzy_mesangy_03320", label: "Pouzy-Mésangy (03320)" },
    { value: "poezat_03800", label: "Poëzat (03800)" },
    { value: "premilhat_03410", label: "Prémilhat (03410)" },
    { value: "perigny_03120", label: "Périgny (03120)" },
    { value: "quinssaines_03380", label: "Quinssaines (03380)" },
    { value: "reugny_03190", label: "Reugny (03190)" },
    { value: "rocles_03240", label: "Rocles (03240)" },
    { value: "rongeres_03150", label: "Rongères (03150)" },
    { value: "ronnet_03420", label: "Ronnet (03420)" },
    { value: "saint_angel_03170", label: "Saint-Angel (03170)" },
    { value: "saint_aubin_le_monial_03160", label: "Saint-Aubin-le-Monial (03160)" },
    { value: "saint_bonnet_troncais_03360", label: "Saint-Bonnet-Tronçais (03360)" },
    { value: "saint_bonnet_de_four_03390", label: "Saint-Bonnet-de-Four (03390)" },
    { value: "saint_bonnet_de_rochefort_03800", label: "Saint-Bonnet-de-Rochefort (03800)" },
    { value: "saint_caprais_03190", label: "Saint-Caprais (03190)" },
    { value: "saint_christophe_03120", label: "Saint-Christophe (03120)" },
    { value: "saint_clement_03250", label: "Saint-Clément (03250)" },
    { value: "saint_didier_en_donjon_03130", label: "Saint-Didier-en-Donjon (03130)" },
    { value: "saint_didier_la_foret_03110", label: "Saint-Didier-la-Forêt (03110)" },
    { value: "saint_desire_03370", label: "Saint-Désiré (03370)" },
    { value: "saint_ennemond_03400", label: "Saint-Ennemond (03400)" },
    { value: "saint_fargeol_03420", label: "Saint-Fargeol (03420)" },
    { value: "saint_felix_03260", label: "Saint-Félix (03260)" },
    { value: "saint_genest_03310", label: "Saint-Genest (03310)" },
    { value: "saint_germain_de_salles_03140", label: "Saint-Germain-de-Salles (03140)" },
    { value: "saint_germain_des_fosses_03260", label: "Saint-Germain-des-Fossés (03260)" },
    { value: "saint_gerand_de_vaux_03340", label: "Saint-Gérand-de-Vaux (03340)" },
    { value: "saint_gerand_le_puy_03150", label: "Saint-Gérand-le-Puy (03150)" },
    { value: "saint_hilaire_03440", label: "Saint-Hilaire (03440)" },
    { value: "saint_loup_03150", label: "Saint-Loup (03150)" },
    { value: "saint_leger_sur_vouzance_03130", label: "Saint-Léger-sur-Vouzance (03130)" },
    { value: "saint_leon_03220", label: "Saint-Léon (03220)" },
    { value: "saint_leopardin_d_augy_03160", label: "Saint-Léopardin-d'Augy (03160)" },
    { value: "saint_marcel_en_marcillat_03420", label: "Saint-Marcel-en-Marcillat (03420)" },
    { value: "saint_marcel_en_murat_03390", label: "Saint-Marcel-en-Murat (03390)" },
    { value: "saint_martin_des_lais_03230", label: "Saint-Martin-des-Lais (03230)" },
    { value: "saint_martinien_03380", label: "Saint-Martinien (03380)" },
    { value: "saint_menoux_03210", label: "Saint-Menoux (03210)" },
    { value: "saint_nicolas_des_biefs_03250", label: "Saint-Nicolas-des-Biefs (03250)" },
    { value: "saint_palais_03370", label: "Saint-Palais (03370)" },
    { value: "saint_pierre_laval_42620", label: "Saint-Pierre-Laval (42620)" },
    { value: "saint_plaisir_03160", label: "Saint-Plaisir (03160)" },
    { value: "saint_pont_03110", label: "Saint-Pont (03110)" },
    { value: "saint_pourcain_sur_besbre_03290", label: "Saint-Pourçain-sur-Besbre (03290)" },
    { value: "saint_pourcain_sur_sioule_03500", label: "Saint-Pourçain-sur-Sioule (03500)" },
    { value: "saint_priest_d_andelot_03800", label: "Saint-Priest-d'Andelot (03800)" },
    { value: "saint_priest_en_murat_03390", label: "Saint-Priest-en-Murat (03390)" },
    { value: "saint_prix_03120", label: "Saint-Prix (03120)" },
    { value: "saint_remy_en_rollat_03110", label: "Saint-Rémy-en-Rollat (03110)" },
    { value: "saint_sauvier_03370", label: "Saint-Sauvier (03370)" },
    { value: "saint_sornin_03240", label: "Saint-Sornin (03240)" },
    { value: "saint_victor_03410", label: "Saint-Victor (03410)" },
    { value: "saint_voir_03220", label: "Saint-Voir (03220)" },
    { value: "saint_yorre_03270", label: "Saint-Yorre (03270)" },
    { value: "saint_eloy_d_allier_03370", label: "Saint-Éloy-d'Allier (03370)" },
    { value: "saint_etienne_de_vicq_03300", label: "Saint-Étienne-de-Vicq (03300)" },
    { value: "sainte_therence_03420", label: "Sainte-Thérence (03420)" },
    { value: "saligny_sur_roudon_03470", label: "Saligny-sur-Roudon (03470)" },
    { value: "sanssat_03150", label: "Sanssat (03150)" },
    { value: "saulcet_03500", label: "Saulcet (03500)" },
    { value: "saulzet_03800", label: "Saulzet (03800)" },
    { value: "sauvagny_03430", label: "Sauvagny (03430)" },
    { value: "sazeret_03390", label: "Sazeret (03390)" },
    { value: "serbannes_03700", label: "Serbannes (03700)" },
    { value: "servilly_03120", label: "Servilly (03120)" },
    { value: "seuillet_03260", label: "Seuillet (03260)" },
    { value: "sorbier_03220", label: "Sorbier (03220)" },
    { value: "souvigny_03210", label: "Souvigny (03210)" },
    { value: "sussat_03450", label: "Sussat (03450)" },
    { value: "target_03140", label: "Target (03140)" },
    { value: "taxat_senat_03140", label: "Taxat-Senat (03140)" },
    { value: "teillet_argenty_03410", label: "Teillet-Argenty (03410)" },
    { value: "terjat_03420", label: "Terjat (03420)" },
    { value: "theneuille_03350", label: "Theneuille (03350)" },
    { value: "thiel_sur_acolin_03230", label: "Thiel-sur-Acolin (03230)" },
    { value: "thionne_03220", label: "Thionne (03220)" },
    { value: "tortezais_03430", label: "Tortezais (03430)" },
    { value: "toulon_sur_allier_03400", label: "Toulon-sur-Allier (03400)" },
    { value: "treban_03240", label: "Treban (03240)" },
    { value: "treignat_03380", label: "Treignat (03380)" },
    { value: "treteau_03220", label: "Treteau (03220)" },
    { value: "tronget_03240", label: "Tronget (03240)" },
    { value: "trevol_03460", label: "Trévol (03460)" },
    { value: "trezelles_03220", label: "Trézelles (03220)" },
    { value: "urcay_03360", label: "Urçay (03360)" },
    { value: "ussel_d_allier_03140", label: "Ussel-d'Allier (03140)" },
    { value: "valignat_03330", label: "Valignat (03330)" },
    { value: "valigny_03360", label: "Valigny (03360)" },
    { value: "vallon_en_sully_03190", label: "Vallon-en-Sully (03190)" },
    { value: "varennes_sur_allier_03150", label: "Varennes-sur-Allier (03150)" },
    { value: "varennes_sur_teche_03220", label: "Varennes-sur-Tèche (03220)" },
    { value: "vaumas_03220", label: "Vaumas (03220)" },
    { value: "vaux_03190", label: "Vaux (03190)" },
    { value: "veauce_03450", label: "Veauce (03450)" },
    { value: "venas_03190", label: "Venas (03190)" },
    { value: "vendat_03110", label: "Vendat (03110)" },
    { value: "verneix_03190", label: "Verneix (03190)" },
    { value: "verneuil_en_bourbonnais_03500", label: "Verneuil-en-Bourbonnais (03500)" },
    { value: "vernusse_03390", label: "Vernusse (03390)" },
    { value: "vichy_03200", label: "Vichy (03200)" },
    { value: "vicq_03450", label: "Vicq (03450)" },
    { value: "vieure_03430", label: "Vieure (03430)" },
    { value: "villebret_03310", label: "Villebret (03310)" },
    { value: "villefranche_d_allier_03430", label: "Villefranche-d'Allier (03430)" },
    { value: "villeneuve_sur_allier_03460", label: "Villeneuve-sur-Allier (03460)" },
    { value: "viplaix_03370", label: "Viplaix (03370)" },
    { value: "vitray_03360", label: "Vitray (03360)" },
    { value: "voussac_03140", label: "Voussac (03140)" },
    { value: "ygrande_03160", label: "Ygrande (03160)" },
    { value: "yzeure_03400", label: "Yzeure (03400)" },
    { value: "ebreuil_03450", label: "Ébreuil (03450)" },
    { value: "echassieres_03330", label: "Échassières (03330)" },
    { value: "etroussat_03140", label: "Étroussat (03140)" },
    { value: "accons_07160", label: "Accons (07160)" },
    { value: "ailhon_07200", label: "Ailhon (07200)" },
    { value: "aizac_07530", label: "Aizac (07530)" },
    { value: "ajoux_07000", label: "Ajoux (07000)" },
    { value: "alba_la_romaine_07400", label: "Alba-la-Romaine (07400)" },
    { value: "albon_d_ardeche_07190", label: "Albon-d'Ardèche (07190)" },
    { value: "alboussiere_07440", label: "Alboussière (07440)" },
    { value: "alissas_07210", label: "Alissas (07210)" },
    { value: "andance_07340", label: "Andance (07340)" },
    { value: "annonay_07100", label: "Annonay (07100)" },
    { value: "antraigues_sur_volane_07530", label: "Antraigues-sur-Volane (07530)" },
    { value: "arcens_07310", label: "Arcens (07310)" },
    { value: "ardoix_07290", label: "Ardoix (07290)" },
    { value: "arlebosc_07410", label: "Arlebosc (07410)" },
    { value: "arras_sur_rhone_07370", label: "Arras-sur-Rhône (07370)" },
    { value: "asperjoc_07600", label: "Asperjoc (07600)" },
    { value: "astet_07330", label: "Astet (07330)" },
    { value: "aubenas_07200", label: "Aubenas (07200)" },
    { value: "aubignas_07400", label: "Aubignas (07400)" },
    { value: "baix_07210", label: "Baix (07210)" },
    { value: "balazuc_07120", label: "Balazuc (07120)" },
    { value: "banne_07460", label: "Banne (07460)" },
    { value: "barnas_07330", label: "Barnas (07330)" },
    { value: "beauchastel_07800", label: "Beauchastel (07800)" },
    { value: "beaulieu_07460", label: "Beaulieu (07460)" },
    { value: "beaumont_07110", label: "Beaumont (07110)" },
    { value: "beavene_07190", label: "Beauvène (07190)" },
    { value: "berrias_et_casteljau_07460", label: "Berrias-et-Casteljau (07460)" },
    { value: "berzeme_07580", label: "Berzème (07580)" },
    { value: "bessas_07150", label: "Bessas (07150)" },
    { value: "bidon_07700", label: "Bidon (07700)" },
    { value: "boffres_07440", label: "Boffres (07440)" },
    { value: "bogy_07340", label: "Bogy (07340)" },
    { value: "borne_07590", label: "Borne (07590)" },
    { value: "boree_07310", label: "Borée (07310)" },
    { value: "boucieu_le_roi_07270", label: "Boucieu-le-Roi (07270)" },
    { value: "boulieu_les_annonay_07100", label: "Boulieu-lès-Annonay (07100)" },
    { value: "bourg_saint_andeol_07700", label: "Bourg-Saint-Andéol (07700)" },
    { value: "bozas_07410", label: "Bozas (07410)" },
    { value: "brossainc_07340", label: "Brossainc (07340)" },
    { value: "burzet_07450", label: "Burzet (07450)" },
    { value: "cellier_du_luc_07590", label: "Cellier-du-Luc (07590)" },
    { value: "chalencon_07240", label: "Chalencon (07240)" },
    { value: "chambonas_07140", label: "Chambonas (07140)" },
    { value: "champagne_07340", label: "Champagne (07340)" },
    { value: "champis_07440", label: "Champis (07440)" },
    { value: "chandolas_07230", label: "Chandolas (07230)" },
    { value: "chaneac_07310", label: "Chanéac (07310)" },
    { value: "charmes_sur_rhone_07800", label: "Charmes-sur-Rhône (07800)" },
    { value: "charnas_07340", label: "Charnas (07340)" },
    { value: "chassiers_07110", label: "Chassiers (07110)" },
    { value: "chauzon_07120", label: "Chauzon (07120)" },
    { value: "chazeaux_07110", label: "Chazeaux (07110)" },
    { value: "cheminas_07300", label: "Cheminas (07300)" },
    { value: "chirols_07380", label: "Chirols (07380)" },
    { value: "chomerac_07210", label: "Chomérac (07210)" },
    { value: "chateaubourg_07130", label: "Châteaubourg (07130)" },
    { value: "chateauneuf_de_vernoux_07240", label: "Châteauneuf-de-Vernoux (07240)" },
    { value: "colombier_le_cardinal_07430", label: "Colombier-le-Cardinal (07430)" },
    { value: "colombier_le_jeune_07270", label: "Colombier-le-Jeune (07270)" },
    { value: "colombier_le_vieux_07410", label: "Colombier-le-Vieux (07410)" },
    { value: "cornas_07130", label: "Cornas (07130)" },
    { value: "coucouron_07470", label: "Coucouron (07470)" },
    { value: "coux_07000", label: "Coux (07000)" },
    { value: "creysseilles_07000", label: "Creysseilles (07000)" },
    { value: "cros_de_georand_07630", label: "Cros-de-Géorand (07630)" },
    { value: "cros_de_georand_07510", label: "Cros-de-Géorand (07510)" },
    { value: "cruas_07350", label: "Cruas (07350)" },
    { value: "darbres_07170", label: "Darbres (07170)" },
    { value: "davezieux_07430", label: "Davézieux (07430)" },
    { value: "devesset_07320", label: "Devesset (07320)" },
    { value: "dompnac_07260", label: "Dompnac (07260)" },
    { value: "dornas_07160", label: "Dornas (07160)" },
    { value: "duniere_sur_evrieux_07360", label: "Dunière-sur-Evrieux (07360)" },
    { value: "desaignes_07570", label: "Désaignes (07570)" },
    { value: "eclassan_07370", label: "Eclassan (07370)" },
    { value: "empurany_07270", label: "Empurany (07270)" },
    { value: "fabras_07380", label: "Fabras (07380)" },
    { value: "faugeres_07230", label: "Faugères (07230)" },
    { value: "flaviac_07000", label: "Flaviac (07000)" },
    { value: "fons_07200", label: "Fons (07200)" },
    { value: "freyssenet_07000", label: "Freyssenet (07000)" },
    { value: "felines_07340", label: "Félines (07340)" },
    { value: "genestelle_07530", label: "Genestelle (07530)" },
    { value: "gilhac_et_bruzac_07800", label: "Gilhac-et-Bruzac (07800)" },
    { value: "gilhoc_sur_ormeze_07270", label: "Gilhoc-sur-Ormèze (07270)" },
    { value: "gluiras_07190", label: "Gluiras (07190)" },
    { value: "glun_07300", label: "Glun (07300)" },
    { value: "gourdon_07000", label: "Gourdon (07000)" },
    { value: "gras_07700", label: "Gras (07700)" },
    { value: "gravieres_07140", label: "Gravières (07140)" },
    { value: "grospierres_07120", label: "Grospierres (07120)" },
    { value: "guilherand_granges_07500", label: "Guilherand-Granges (07500)" },
    { value: "intres_07310", label: "Intres (07310)" },
    { value: "intres_07320", label: "Intres (07320)" },
    { value: "issamoulenc_07190", label: "Issamoulenc (07190)" },
    { value: "issanlas_07510", label: "Issanlas (07510)" },
    { value: "issanlas_07660", label: "Issanlas (07660)" },
    { value: "issarles_07470", label: "Issarlès (07470)" },
    { value: "jaujac_07380", label: "Jaujac (07380)" },
    { value: "jaunac_07160", label: "Jaunac (07160)" },
    { value: "joannas_07110", label: "Joannas (07110)" },
    { value: "joyeuse_07260", label: "Joyeuse (07260)" },
    { value: "juvinas_07600", label: "Juvinas (07600)" },
    { value: "la_rochette_07310", label: "La Rochette (07310)" },
    { value: "la_souche_07380", label: "La Souche (07380)" },
    { value: "la_voulte_sur_rhone_07800", label: "La Voulte-sur-Rhône (07800)" },
    { value: "labastide_de_virac_07150", label: "Labastide-de-Virac (07150)" },
    { value: "labastide_sur_besorgues_07600", label: "Labastide-sur-Bésorgues (07600)" },
    { value: "labatie_d_andaure_07570", label: "Labatie-d'Andaure (07570)" },
    { value: "labeaume_07120", label: "Labeaume (07120)" },
    { value: "lablachere_07230", label: "Lablachère (07230)" },
    { value: "laboule_07110", label: "Laboule (07110)" },
    { value: "labegude_07200", label: "Labégude (07200)" },
    { value: "lachamp_raphael_07530", label: "Lachamp-Raphaël (07530)" },
    { value: "lachapelle_graillouse_07470", label: "Lachapelle-Graillouse (07470)" },
    { value: "lachapelle_sous_aubenas_07200", label: "Lachapelle-sous-Aubenas (07200)" },
    { value: "lachapelle_sous_chaneac_07310", label: "Lachapelle-sous-Chanéac (07310)" },
    { value: "lafarre_07520", label: "Lafarre (07520)" },
    { value: "lagorce_07150", label: "Lagorce (07150)" },
    { value: "lalevade_d_ardeche_07380", label: "Lalevade-d'Ardèche (07380)" },
    { value: "lalouvesc_07520", label: "Lalouvesc (07520)" },
    { value: "lamastre_07270", label: "Lamastre (07270)" },
    { value: "lanarce_07660", label: "Lanarce (07660)" },
    { value: "lanas_07200", label: "Lanas (07200)" },
    { value: "largentiere_07110", label: "Largentière (07110)" },
    { value: "larnas_07220", label: "Larnas (07220)" },
    { value: "laurac_en_vivarais_07110", label: "Laurac-en-Vivarais (07110)" },
    { value: "laval_d_aurelle_07590", label: "Laval-d'Aurelle (07590)" },
    { value: "laveyrune_48250", label: "Laveyrune (48250)" },
    { value: "lavillatte_07660", label: "Lavillatte (07660)" },
    { value: "lavilledieu_07170", label: "Lavilledieu (07170)" },
    { value: "laviolle_07530", label: "Laviolle (07530)" },
    { value: "le_beage_07630", label: "Le Béage (07630)" },
    { value: "le_chambon_07160", label: "Le Chambon (07160)" },
    { value: "le_cheylard_07160", label: "Le Cheylard (07160)" },
    { value: "le_crestet_07270", label: "Le Crestet (07270)" },
    { value: "le_lac_d_issarles_07470", label: "Le Lac-d'Issarlès (07470)" },
    { value: "le_plagnal_07590", label: "Le Plagnal (07590)" },
    { value: "le_pouzin_07250", label: "Le Pouzin (07250)" },
    { value: "le_roux_07560", label: "Le Roux (07560)" },
    { value: "le_teil_07400", label: "Le Teil (07400)" },
    { value: "lemps_07610", label: "Lemps (07610)" },
    { value: "lentilleres_07200", label: "Lentillères (07200)" },
    { value: "les_assions_07140", label: "Les Assions (07140)" },
    { value: "les_ollieres_sur_eyrieux_07360", label: "Les Ollières-sur-Eyrieux (07360)" },
    { value: "les_salelles_07140", label: "Les Salelles (07140)" },
    { value: "les_vans_07140", label: "Les Vans (07140)" },
    { value: "lesperon_07660", label: "Lespéron (07660)" },
    { value: "limony_07340", label: "Limony (07340)" },
    { value: "loubaresse_07110", label: "Loubaresse (07110)" },
    { value: "lussas_07170", label: "Lussas (07170)" },
    { value: "lyas_07000", label: "Lyas (07000)" },
    { value: "malarce_sur_la_thines_07140", label: "Malarce-sur-la-Thines (07140)" },
    { value: "malbosc_07140", label: "Malbosc (07140)" },
    { value: "marcols_les_eaux_07190", label: "Marcols-les-Eaux (07190)" },
    { value: "mariac_07160", label: "Mariac (07160)" },
    { value: "mars_07320", label: "Mars (07320)" },
    { value: "mauves_07300", label: "Mauves (07300)" },
    { value: "mayres_07330", label: "Mayres (07330)" },
    { value: "mazan_l_abbaye_07510", label: "Mazan-l'Abbaye (07510)" },
    { value: "mercuer_07200", label: "Mercuer (07200)" },
    { value: "meyras_07380", label: "Meyras (07380)" },
    { value: "meysse_07400", label: "Meysse (07400)" },
    { value: "mirabel_07170", label: "Mirabel (07170)" },
    { value: "monestier_07690", label: "Monestier (07690)" },
    { value: "montpezat_sous_bauzon_07560", label: "Montpezat-sous-Bauzon (07560)" },
    { value: "montreal_07110", label: "Montréal (07110)" },
    { value: "montselgues_07140", label: "Montselgues (07140)" },
    { value: "mezilhac_07530", label: "Mézilhac (07530)" },
    { value: "nonieres_07160", label: "Nonières (07160)" },
    { value: "nozieres_07270", label: "Nozières (07270)" },
    { value: "orgnac_l_aven_07150", label: "Orgnac-l'Aven (07150)" },
    { value: "ozon_07370", label: "Ozon (07370)" },
    { value: "pailhares_07410", label: "Pailharès (07410)" },
    { value: "payzac_07230", label: "Payzac (07230)" },
    { value: "peaugres_07340", label: "Peaugres (07340)" },
    { value: "peyraud_07340", label: "Peyraud (07340)" },
    { value: "planzolles_07230", label: "Planzolles (07230)" },
    { value: "plats_07300", label: "Plats (07300)" },
    { value: "pont_de_labeaume_07380", label: "Pont-de-Labeaume (07380)" },
    { value: "pourcheres_07000", label: "Pourchères (07000)" },
    { value: "prades_07380", label: "Prades (07380)" },
    { value: "pradons_07120", label: "Pradons (07120)" },
    { value: "pranles_07000", label: "Pranles (07000)" },
    { value: "privas_07000", label: "Privas (07000)" },
    { value: "prunet_07110", label: "Prunet (07110)" },
    { value: "preaux_07290", label: "Préaux (07290)" },
    { value: "pereyres_07450", label: "Péreyres (07450)" },
    { value: "quintenas_07290", label: "Quintenas (07290)" },
    { value: "ribes_07260", label: "Ribes (07260)" },
    { value: "rochecolombe_07200", label: "Rochecolombe (07200)" },
    { value: "rochemaure_07400", label: "Rochemaure (07400)" },
    { value: "rochepaule_07320", label: "Rochepaule (07320)" },
    { value: "rocher_07110", label: "Rocher (07110)" },
    { value: "rochesauve_07210", label: "Rochesauve (07210)" },
    { value: "rocles_07110", label: "Rocles (07110)" },
    { value: "roiffieux_07100", label: "Roiffieux (07100)" },
    { value: "rompon_07800", label: "Rompon (07800)" },
    { value: "rompon_07250", label: "Rompon (07250)" },
    { value: "rosieres_07260", label: "Rosières (07260)" },
    { value: "ruoms_07120", label: "Ruoms (07120)" },
    { value: "sablieres_07260", label: "Sablières (07260)" },
    { value: "sagnes_et_goudoulet_07450", label: "Sagnes-et-Goudoulet (07450)" },
    { value: "saint_agreve_07320", label: "Saint-Agrève (07320)" },
    { value: "saint_alban_auriolles_07120", label: "Saint-Alban-Auriolles (07120)" },
    { value: "saint_alban_d_ay_07790", label: "Saint-Alban-d'Ay (07790)" },
    { value: "saint_alban_en_montagne_07590", label: "Saint-Alban-en-Montagne (07590)" },
    { value: "saint_andre_lachamp_07230", label: "Saint-André-Lachamp (07230)" },
    { value: "saint_andre_de_cruzieres_07460", label: "Saint-André-de-Cruzières (07460)" },
    { value: "saint_andre_en_vivarais_07690", label: "Saint-André-en-Vivarais (07690)" },
    { value: "saint_andeol_de_berg_07170", label: "Saint-Andéol-de-Berg (07170)" },
    { value: "saint_andeol_de_fourchades_07160", label: "Saint-Andéol-de-Fourchades (07160)" },
    { value: "saint_andeol_de_vals_07600", label: "Saint-Andéol-de-Vals (07600)" },
    { value: "saint_apollinaire_de_rias_07240", label: "Saint-Apollinaire-de-Rias (07240)" },
    { value: "saint_barthelemy_grozon_07270", label: "Saint-Barthélemy-Grozon (07270)" },
    { value: "saint_barthelemy_le_meil_07160", label: "Saint-Barthélemy-le-Meil (07160)" },
    { value: "saint_barthelemy_le_plain_07300", label: "Saint-Barthélemy-le-Plain (07300)" },
    { value: "saint_basile_07270", label: "Saint-Basile (07270)" },
    { value: "saint_bauzile_07210", label: "Saint-Bauzile (07210)" },
    { value: "saint_christol_07160", label: "Saint-Christol (07160)" },
    { value: "saint_cierge_la_serre_07800", label: "Saint-Cierge-la-Serre (07800)" },
    { value: "saint_cierge_sous_le_cheylard_07160", label: "Saint-Cierge-sous-le-Cheylard (07160)" },
    { value: "saint_cirgues_de_prades_07380", label: "Saint-Cirgues-de-Prades (07380)" },
    { value: "saint_cirgues_en_montagne_07510", label: "Saint-Cirgues-en-Montagne (07510)" },
    { value: "saint_clair_07430", label: "Saint-Clair (07430)" },
    { value: "saint_clement_07310", label: "Saint-Clément (07310)" },
    { value: "saint_cyr_07430", label: "Saint-Cyr (07430)" },
    { value: "saint_didier_sous_aubenas_07200", label: "Saint-Didier-sous-Aubenas (07200)" },
    { value: "saint_desirat_07340", label: "Saint-Désirat (07340)" },
    { value: "saint_fortunat_sur_eyrieux_07360", label: "Saint-Fortunat-sur-Eyrieux (07360)" },
    { value: "saint_felicien_07410", label: "Saint-Félicien (07410)" },
    { value: "saint_genest_lachamp_07190", label: "Saint-Genest-Lachamp (07190)" },
    { value: "saint_genest_lachamp_07160", label: "Saint-Genest-Lachamp (07160)" },
    { value: "saint_genest_de_beauzon_07230", label: "Saint-Genest-de-Beauzon (07230)" },
    { value: "saint_georges_les_bains_07800", label: "Saint-Georges-les-Bains (07800)" },
    { value: "saint_germain_07170", label: "Saint-Germain (07170)" },
    { value: "saint_gineis_en_coiron_07580", label: "Saint-Gineis-en-Coiron (07580)" },
    { value: "saint_jacques_d_atticieux_07340", label: "Saint-Jacques-d'Atticieux (07340)" },
    { value: "saint_jean_chambre_07240", label: "Saint-Jean-Chambre (07240)" },
    { value: "saint_jean_roure_07160", label: "Saint-Jean-Roure (07160)" },
    { value: "saint_jean_de_muzols_07300", label: "Saint-Jean-de-Muzols (07300)" },
    { value: "saint_jean_le_centenier_07580", label: "Saint-Jean-le-Centenier (07580)" },
    { value: "saint_jeure_d_andaure_07320", label: "Saint-Jeure-d'Andaure (07320)" },
    { value: "saint_jeure_d_ay_07290", label: "Saint-Jeure-d'Ay (07290)" },
    { value: "saint_joseph_des_bancs_07530", label: "Saint-Joseph-des-Bancs (07530)" },
    { value: "saint_julien_boutieres_07310", label: "Saint-Julien-Boutières (07310)" },
    { value: "saint_julien_labrousse_07160", label: "Saint-Julien-Labrousse (07160)" },
    { value: "saint_julien_vocance_07690", label: "Saint-Julien-Vocance (07690)" },
    { value: "saint_julien_du_gua_07190", label: "Saint-Julien-du-Gua (07190)" },
    { value: "saint_julien_du_serre_07200", label: "Saint-Julien-du-Serre (07200)" },
    { value: "saint_julien_en_saint_alban_07000", label: "Saint-Julien-en-Saint-Alban (07000)" },
    { value: "saint_julien_le_roux_07240", label: "Saint-Julien-le-Roux (07240)" },
    { value: "saint_just_d_ardeche_07700", label: "Saint-Just-d'Ardèche (07700)" },
    { value: "saint_lager_bressac_07210", label: "Saint-Lager-Bressac (07210)" },
    { value: "saint_laurent_du_pape_07800", label: "Saint-Laurent-du-Pape (07800)" },
    { value: "saint_laurent_les_bains_07590", label: "Saint-Laurent-les-Bains (07590)" },
    { value: "saint_laurent_sous_coiron_07170", label: "Saint-Laurent-sous-Coiron (07170)" },
    { value: "saint_marcel_d_ardeche_07700", label: "Saint-Marcel-d'Ardèche (07700)" },
    { value: "saint_marcel_les_annonay_07100", label: "Saint-Marcel-lès-Annonay (07100)" },
    { value: "saint_martial_07310", label: "Saint-Martial (07310)" },
    { value: "saint_martin_d_ardeche_07700", label: "Saint-Martin-d'Ardèche (07700)" },
    { value: "saint_martin_de_valamas_07310", label: "Saint-Martin-de-Valamas (07310)" },
    { value: "saint_martin_sur_lavezon_07400", label: "Saint-Martin-sur-Lavezon (07400)" },
    { value: "saint_maurice_d_ardeche_07200", label: "Saint-Maurice-d'Ardèche (07200)" },
    { value: "saint_maurice_d_ibie_07170", label: "Saint-Maurice-d'Ibie (07170)" },
    { value: "saint_maurice_en_chalencon_07190", label: "Saint-Maurice-en-Chalencon (07190)" },
    { value: "saint_michel_d_aurance_07160", label: "Saint-Michel-d'Aurance (07160)" },
    { value: "saint_michel_de_boulogne_07200", label: "Saint-Michel-de-Boulogne (07200)" },
    { value: "saint_michel_de_chabrillanoux_07360", label: "Saint-Michel-de-Chabrillanoux (07360)" },
    { value: "saint_montan_07220", label: "Saint-Montan (07220)" },
    { value: "saint_melany_07260", label: "Saint-Mélany (07260)" },
    { value: "saint_paul_le_jeune_07460", label: "Saint-Paul-le-Jeune (07460)" },
    { value: "saint_pierre_saint_jean_07140", label: "Saint-Pierre-Saint-Jean (07140)" },
    { value: "saint_pierre_de_colombier_07450", label: "Saint-Pierre-de-Colombier (07450)" },
    { value: "saint_pierre_la_roche_07400", label: "Saint-Pierre-la-Roche (07400)" },
    { value: "saint_pierre_sur_doux_07520", label: "Saint-Pierre-sur-Doux (07520)" },
  ];