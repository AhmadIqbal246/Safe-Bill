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
      },
      {
        id: "genie_civil",
        label: "Génie civil",
        subcategories: []
      },
      {
        id: "second_oeuvre",
        label: "Second œuvre",
        subcategories: [
          { id: "plomberie", label: "Plomberie" },
          { id: "carrelage_faience", label: "Carrelage et faïence" },
          { id: "parquet", label: "Parquet (massif, contrecollé, stratifié)" },
          { id: "moquette_textile", label: "Moquette et textile" },
          { id: "sol_vinyle_pvc", label: "Sol vinyle/PVC" },
          { id: "resine_epoxy", label: "Résine époxy" },
          { id: "beton_cire", label: "Béton ciré" },
          { id: "peinture_decorative_technique", label: "Peinture décorative et technique" },
          { id: "papier_peint_revetements_muraux", label: "Papier peint et revêtements muraux" },
          { id: "lambris_bois_pvc", label: "Lambris bois ou PVC" },
          { id: "enduits_decoratifs", label: "Enduits décoratifs" },
          { id: "carrelage_mural", label: "Carrelage mural" },
          { id: "cloisons_seches_doublages", label: "Cloisons sèches et doublages" },
          { id: "plafonds_suspendus", label: "Plafonds suspendus" },
          { id: "faux_plafonds_decoratifs", label: "Faux plafonds décoratifs" },
          { id: "peinture_plafond", label: "Peinture de plafond" },
          { id: "plafonds_tendus", label: "Plafonds tendus" },
          { id: "portes_interieures", label: "Portes intérieures" },
          { id: "placards_rangements", label: "Placards et rangements" },
          { id: "escaliers_interieurs", label: "Escaliers intérieurs" },
          { id: "parquets_plinthes", label: "Parquets et plinthes" },
          { id: "habillages_divers", label: "Habillages divers" },
          { id: "autre", label: "Autre" }
        ]
      },
      {
        id: "materiaux",
        label: "Matériaux",
        subcategories: []
      }
    ]
  },
  {
    id: "commerce_distribution",
    label: "Commerce / Distribution",
    categories: [
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
          { id: "ruby", label: "Ruby" },
          { id: "java", label: "Java" },
          { id: "csharp", label: "C#" },
          { id: "go", label: "Go" },
          { id: "perl", label: "Perl" },
          { id: "swift", label: "Swift" },
          { id: "kotlin", label: "Kotlin" },
          { id: "dotnet", label: ".NET" },
          { id: "nodejs", label: "Node.js" }
        ]
      },
      {
        id: "applications_mobiles",
        label: "Applications mobiles",
        subcategories: [
          { id: "applications_mobiles", label: "Applications mobiles" },
          { id: "java", label: "Java" },
          { id: "kotlin", label: "Kotlin" },
          { id: "swift", label: "Swift" },
          { id: "objective_c", label: "Objective-C" },
          { id: "csharp", label: "C#" },
          { id: "dart", label: "Dart" },
          { id: "javascript", label: "JavaScript" },
          { id: "python", label: "Python" },
          { id: "cpp", label: "C++" },
          { id: "html5", label: "HTML5" }
        ]
      },
      {
        id: "cybersecurite",
        label: "Cybersécurité",
        subcategories: []
      },
      {
        id: "cloud_computing",
        label: "Cloud computing",
        subcategories: []
      },
      {
        id: "ux_ui",
        label: "UX/UI",
        subcategories: []
      },
      {
        id: "data",
        label: "Data",
        subcategories: []
      },
      {
        id: "e_commerce",
        label: "E-commerce",
        subcategories: []
      },
      {
        id: "reseaux_sociaux",
        label: "Réseaux sociaux",
        subcategories: []
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
      },
      {
        id: "creation_contenu",
        label: "Création de contenu",
        subcategories: []
      },
      {
        id: "influence",
        label: "Influence",
        subcategories: []
      },
      {
        id: "data_marketing",
        label: "Data marketing",
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
      },
      {
        id: "evenement_sportif",
        label: "Événement sportif",
        subcategories: []
      }
    ]
  },
  {
    id: "nettoyage_proprete_services_generaux",
    label: "Nettoyage / Propreté / Services généraux",
    categories: [
      {
        id: "nettoyage_industriel",
        label: "Nettoyage industriel",
        subcategories: []
      },
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
    id: "immobilier",
    label: "Immobilier",
    categories: [
      {
        id: "agence",
        label: "Agence",
        subcategories: []
      },
      {
        id: "gestion_locative",
        label: "Gestion locative",
        subcategories: []
      },
      {
        id: "promotion",
        label: "Promotion",
        subcategories: []
      },
      {
        id: "syndic_copropriete",
        label: "Syndic de copropriété",
        subcategories: []
      }
    ]
  },
  {
    id: "industrie",
    label: "Industrie (tous secteurs confondus)",
    categories: [
      {
        id: "metallurgie",
        label: "Métallurgie",
        subcategories: []
      },
      {
        id: "textile",
        label: "Textile",
        subcategories: []
      },
      {
        id: "chimie",
        label: "Chimie",
        subcategories: []
      },
      {
        id: "machines",
        label: "Machines",
        subcategories: []
      },
      {
        id: "electronique",
        label: "Électronique",
        subcategories: []
      }
    ]
  },
  {
    id: "informatique_telecommunications",
    label: "Informatique / Télécommunications",
    categories: [
      {
        id: "developpement_logiciel",
        label: "Développement logiciel",
        subcategories: []
      },
      {
        id: "reseaux",
        label: "Réseaux",
        subcategories: []
      },
      {
        id: "materiel",
        label: "Matériel",
        subcategories: []
      },
      {
        id: "services",
        label: "Services",
        subcategories: []
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
  },
  {
    id: "medical_paramedical_sante",
    label: "Médical / Paramédical / Santé",
    categories: [
      {
        id: "medecine_generale",
        label: "Médecine générale",
        subcategories: []
      },
      {
        id: "paramedical",
        label: "Paramédical",
        subcategories: []
      },
      {
        id: "soins_infirmiers",
        label: "Soins infirmiers",
        subcategories: []
      },
      {
        id: "laboratoire",
        label: "Laboratoire",
        subcategories: []
      },
      {
        id: "clinique",
        label: "Clinique",
        subcategories: []
      },
      {
        id: "pharmacien",
        label: "Pharmacien",
        subcategories: []
      },
      {
        id: "telemedecine",
        label: "Télémédecine",
        subcategories: []
      },
      {
        id: "dispositifs_medicaux",
        label: "Dispositifs médicaux",
        subcategories: []
      }
    ]
  },
  {
    id: "startups_innovation_technologique",
    label: "Startups / Innovation technologique",
    categories: [
      {
        id: "fintech",
        label: "Fintech",
        subcategories: []
      },
      {
        id: "healthtech",
        label: "Healthtech",
        subcategories: []
      },
      {
        id: "edtech",
        label: "Edtech",
        subcategories: []
      },
      {
        id: "greentech",
        label: "Greentech",
        subcategories: []
      },
      {
        id: "intelligence_artificielle",
        label: "Intelligence artificielle",
        subcategories: []
      },
      {
        id: "blockchain",
        label: "Blockchain",
        subcategories: []
      },
      {
        id: "iot",
        label: "IoT",
        subcategories: []
      },
      {
        id: "robotique",
        label: "Robotique",
        subcategories: []
      },
      {
        id: "incubateurs",
        label: "Incubateurs",
        subcategories: []
      },
      {
        id: "accelerateurs",
        label: "Accélérateurs",
        subcategories: []
      }
    ]
  },
  {
    id: "travail_temporaire_recrutement",
    label: "Travail temporaire / Recrutement",
    categories: [
      {
        id: "interim",
        label: "Intérim",
        subcategories: []
      },
      {
        id: "cabinet_recrutement",
        label: "Cabinet de recrutement",
        subcategories: []
      },
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
    id: "autre",
    label: "Autre",
    categories: []
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
  
// Service areas (Departments) – updated list per provided screenshots
export const serviceAreaOptions = [
  // Auvergne-Rhône-Alpes
  { value: "ENTIRE_FRANCE", label: "Entire France" },
  { value: "ain_01", label: "Ain (01)" },
  { value: "allier_03", label: "Allier (03)" },
  { value: "ardeche_07", label: "Ardèche (07)" },
  { value: "cantal_15", label: "Cantal (15)" },
  { value: "drome_26", label: "Drôme (26)" },
  { value: "isere_38", label: "Isère (38)" },
  { value: "loire_42", label: "Loire (42)" },
  { value: "haute_loire_43", label: "Haute-Loire (43)" },
  { value: "puy_de_dome_63", label: "Puy-de-Dôme (63)" },
  { value: "rhone_69", label: "Rhône (69)" },
  { value: "savoie_73", label: "Savoie (73)" },
  { value: "haute_savoie_74", label: "Haute-Savoie (74)" },

  // Bourgogne-Franche-Comté
  { value: "cote_d_or_21", label: "Côte-d'Or (21)" },
  { value: "doubs_25", label: "Doubs (25)" },
  { value: "jura_39", label: "Jura (39)" },
  { value: "nievre_58", label: "Nièvre (58)" },
  { value: "haute_saone_70", label: "Haute-Saône (70)" },
  { value: "saone_et_loire_71", label: "Saône-et-Loire (71)" },
  { value: "yonne_89", label: "Yonne (89)" },
  { value: "territoire_de_belfort_90", label: "Territoire de Belfort (90)" },

  // Bretagne
  { value: "cotes_d_armor_22", label: "Côtes-d'Armor (22)" },
  { value: "finistere_29", label: "Finistère (29)" },
  { value: "ille_et_vilaine_35", label: "Ille-et-Vilaine (35)" },
  { value: "morbihan_56", label: "Morbihan (56)" },

  // Centre-Val de Loire
  { value: "cher_18", label: "Cher (18)" },
  { value: "eure_et_loir_28", label: "Eure-et-Loir (28)" },
  { value: "indre_36", label: "Indre (36)" },
  { value: "indre_et_loire_37", label: "Indre-et-Loire (37)" },
  { value: "loir_et_cher_41", label: "Loir-et-Cher (41)" },
  { value: "loiret_45", label: "Loiret (45)" },

  // Corse
  { value: "corse_du_sud_2a", label: "Corse-du-Sud (2A)" },
  { value: "haute_corse_2b", label: "Haute-Corse (2B)" },

  // Grand Est
  { value: "marne_51", label: "Marne (51)" },
  { value: "haute_marne_52", label: "Haute-Marne (52)" },
  { value: "meurthe_et_moselle_54", label: "Meurthe-et-Moselle (54)" },
  { value: "meuse_55", label: "Meuse (55)" },
  { value: "moselle_57", label: "Moselle (57)" },
  { value: "bas_rhin_67", label: "Bas-Rhin (67)" },
  { value: "haut_rhin_68", label: "Haut-Rhin (68)" },
  { value: "vosges_88", label: "Vosges (88)" },

  // Hauts-de-France
  { value: "aisne_02", label: "Aisne (02)" },
  { value: "nord_59", label: "Nord (59)" },
  { value: "oise_60", label: "Oise (60)" },
  { value: "pas_de_calais_62", label: "Pas-de-Calais (62)" },
  { value: "somme_80", label: "Somme (80)" },

  // Normandie
  { value: "calvados_14", label: "Calvados (14)" },
  { value: "eure_27", label: "Eure (27)" },
  { value: "manche_50", label: "Manche (50)" },
  { value: "orne_61", label: "Orne (61)" },
  { value: "seine_maritime_76", label: "Seine-Maritime (76)" },

  // Nouvelle-Aquitaine
  { value: "charente_16", label: "Charente (16)" },
  { value: "charente_maritime_17", label: "Charente-Maritime (17)" },
  { value: "correze_19", label: "Corrèze (19)" },
  { value: "creuse_23", label: "Creuse (23)" },
  { value: "dordogne_24", label: "Dordogne (24)" },
  { value: "gironde_33", label: "Gironde (33)" },
  { value: "landes_40", label: "Landes (40)" },
  { value: "lot_et_garonne_47", label: "Lot-et-Garonne (47)" },
  { value: "pyrenees_atlantiques_64", label: "Pyrénées-Atlantiques (64)" },
  { value: "deux_sevres_79", label: "Deux-Sèvres (79)" },
  { value: "vienne_86", label: "Vienne (86)" },
  { value: "haute_vienne_87", label: "Haute-Vienne (87)" },

  // Occitanie
  { value: "ariege_09", label: "Ariège (09)" },
  { value: "aude_11", label: "Aude (11)" },
  { value: "aveyron_12", label: "Aveyron (12)" },
  { value: "gard_30", label: "Gard (30)" },
  { value: "haute_garonne_31", label: "Haute-Garonne (31)" },
  { value: "gers_32", label: "Gers (32)" },
  { value: "herault_34", label: "Hérault (34)" },
  { value: "lot_46", label: "Lot (46)" },
  { value: "lozere_48", label: "Lozère (48)" },
  { value: "hautes_pyrenees_65", label: "Hautes-Pyrénées (65)" },
  { value: "pyrenees_orientales_66", label: "Pyrénées-Orientales (66)" },
  { value: "tarn_81", label: "Tarn (81)" },
  { value: "tarn_et_garonne_82", label: "Tarn-et-Garonne (82)" },

  // Pays de la Loire
  { value: "loire_atlantique_44", label: "Loire-Atlantique (44)" },
  { value: "maine_et_loire_49", label: "Maine-et-Loire (49)" },
  { value: "mayenne_53", label: "Mayenne (53)" },
  { value: "sarthe_72", label: "Sarthe (72)" },
  { value: "vendee_85", label: "Vendée (85)" },

  // Provence-Alpes-Côte d'Azur
  { value: "alpes_de_haute_provence_04", label: "Alpes-de-Haute-Provence (04)" },
  { value: "hautes_alpes_05", label: "Hautes-Alpes (05)" },
  { value: "alpes_maritimes_06", label: "Alpes-Maritimes (06)" },
  { value: "bouches_du_rhone_13", label: "Bouches-du-Rhône (13)" },
  { value: "var_83", label: "Var (83)" },
  { value: "vaucluse_84", label: "Vaucluse (84)" },

  // Île-de-France
  { value: "paris_75", label: "Paris (75)" },
  { value: "seine_et_marne_77", label: "Seine-et-Marne (77)" },
  { value: "yvelines_78", label: "Yvelines (78)" },
  { value: "essonne_91", label: "Essonne (91)" },
  { value: "hauts_de_seine_92", label: "Hauts-de-Seine (92)" },
  { value: "seine_saint_denis_93", label: "Seine-Saint-Denis (93)" },
  { value: "val_de_marne_94", label: "Val-de-Marne (94)" },
  { value: "val_d_oise_95", label: "Val-d'Oise (95)" },

  // Outre-mer
  { value: "guadeloupe_971", label: "Guadeloupe (971)" },
  { value: "martinique_972", label: "Martinique (972)" },
  { value: "guyane_973", label: "Guyane (973)" },
  { value: "la_reunion_974", label: "La Réunion (974)" },
  { value: "mayotte_976", label: "Mayotte (976)" },
];

// Regions to Departments mapping (for macro filtering without adding region to user model)
export const regionToDepartments = {
  // Auvergne-Rhône-Alpes
  auvergne_rhone_alpes: [
    "ain_01","allier_03","ardeche_07","cantal_15","drome_26","isere_38","loire_42","haute_loire_43","puy_de_dome_63","rhone_69","savoie_73","haute_savoie_74"
  ],
  // Bourgogne-Franche-Comté
  bourgogne_franche_comte: [
    "cote_d_or_21","doubs_25","jura_39","nievre_58","haute_saone_70","saone_et_loire_71","yonne_89","territoire_de_belfort_90"
  ],
  // Bretagne
  bretagne: ["cotes_d_armor_22","finistere_29","ille_et_vilaine_35","morbihan_56"],
  // Centre-Val de Loire
  centre_val_de_loire: ["cher_18","eure_et_loir_28","indre_36","indre_et_loire_37","loir_et_cher_41","loiret_45"],
  // Corse
  corse: ["corse_du_sud_2a","haute_corse_2b"],
  // Grand Est
  grand_est: ["marne_51","haute_marne_52","meurthe_et_moselle_54","meuse_55","moselle_57","bas_rhin_67","haut_rhin_68","vosges_88"],
  // Hauts-de-France
  hauts_de_france: ["aisne_02","nord_59","oise_60","pas_de_calais_62","somme_80"],
  // Normandie
  normandie: ["calvados_14","eure_27","manche_50","orne_61","seine_maritime_76"],
  // Nouvelle-Aquitaine
  nouvelle_aquitaine: ["charente_16","charente_maritime_17","correze_19","creuse_23","dordogne_24","gironde_33","landes_40","lot_et_garonne_47","pyrenees_atlantiques_64","deux_sevres_79","vienne_86","haute_vienne_87"],
  // Occitanie
  occitanie: ["ariege_09","aude_11","aveyron_12","gard_30","haute_garonne_31","gers_32","herault_34","lot_46","lozere_48","hautes_pyrenees_65","pyrenees_orientales_66","tarn_81","tarn_et_garonne_82"],
  // Pays de la Loire
  pays_de_la_loire: ["loire_atlantique_44","maine_et_loire_49","mayenne_53","sarthe_72","vendee_85"],
  // Provence-Alpes-Côte d'Azur
  provence_alpes_cote_d_azur: ["alpes_de_haute_provence_04","hautes_alpes_05","alpes_maritimes_06","bouches_du_rhone_13","var_83","vaucluse_84"],
  // Île-de-France
  ile_de_france: ["paris_75","seine_et_marne_77","yvelines_78","essonne_91","hauts_de_seine_92","seine_saint_denis_93","val_de_marne_94","val_d_oise_95"],
  // Outre-mer (treated as regions)
  outre_mer: ["guadeloupe_971","martinique_972","guyane_973","la_reunion_974","mayotte_976"],
};