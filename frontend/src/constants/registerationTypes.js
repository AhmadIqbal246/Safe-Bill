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
    { value: "ambutrix_01500", label: "Ambutrix (01500)" },
    { value: "andert_et_condon_01300", label: "Andert-et-Condon (01300)" },
    { value: "anglefort_01350", label: "Anglefort (01350)" },
    { value: "apremont_01100", label: "Apremont (01100)" },
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
    { value: "beligneux_01360", label: "Béli­gnieux (01360)" },
    { value: "belley_01300", label: "Belley (01300)" },
    { value: "belleydoux_01130", label: "Belleydoux (01130)" },
    { value: "bellignat_01810", label: "Bellignat (01810)" },
    { value: "benonces_01470", label: "Bénonces (01470)" },
  ];