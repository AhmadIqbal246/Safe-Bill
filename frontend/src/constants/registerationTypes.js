// constants/businessTypes.js

// Skills options (your existing array)
export const skillOptions = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "painting", label: "Painting" },
  { value: "carpentry", label: "Carpentry" },
  { value: "cleaning", label: "Cleaning" },
  { value: "construction", label: "Construction" },
  { value: "building_maintenance", label: "Building Maintenance" },
  { value: "gardening", label: "Gardening/Landscaping" },
  { value: "locksmith", label: "Locksmith" },
  { value: "glazing", label: "Glazing" },
  { value: "tiling", label: "Tiling" },
  { value: "flooring", label: "Flooring" },
  { value: "plastering", label: "Plastering" },
  { value: "insulation", label: "Insulation" },
  { value: "heating", label: "Heating/Air Conditioning" },
  { value: "roofing", label: "Roofing" },
  { value: "windows_doors", label: "Windows and Doors" },
  { value: "kitchen_bathroom", label: "Kitchen/Bathroom Installation" },
  { value: "electrical_appliances", label: "Electrical Appliances" },
  { value: "furniture_assembly", label: "Furniture Assembly" },
  { value: "moving_services", label: "Moving Services" },
  { value: "pest_control", label: "Pest Control" },
  { value: "chimney_sweep", label: "Chimney Sweep" },
  { value: "security_systems", label: "Security Systems" },
  { value: "interior_design", label: "Interior Design" },
  { value: "handyman", label: "Handyman Services" },
  { value: "waste_management", label: "Waste Management" },
  { value: "water_damage", label: "Water Damage Restoration" },
  { value: "painting_decorating", label: "Painting & Decorating" },
  { value: "renovation", label: "Renovation" },
  { value: "energy_audit", label: "Energy Audit" },
  // ...add more
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
  { value: "paris", label: "Paris" },
  { value: "lyon", label: "Lyon" },
  { value: "marseille", label: "Marseille" },
  { value: "toulouse", label: "Toulouse" },
  { value: "nice", label: "Nice" },
  { value: "nantes", label: "Nantes" },
  { value: "montpellier", label: "Montpellier" },
  { value: "strasbourg", label: "Strasbourg" },
  { value: "bordeaux", label: "Bordeaux" },
  { value: "lille", label: "Lille" },
  { value: "rennes", label: "Rennes" },
  { value: "reims", label: "Reims" },
  { value: "le_havre", label: "Le Havre" },
  { value: "saint_etienne", label: "Saint-Étienne" },
  { value: "toulon", label: "Toulon" },
  { value: "grenoble", label: "Grenoble" },
  { value: "dijon", label: "Dijon" },
  { value: "angers", label: "Angers" },
  { value: "nimes", label: "Nîmes" },
  { value: "villeurbanne", label: "Villeurbanne" }
];