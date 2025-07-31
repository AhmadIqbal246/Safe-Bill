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
  
  // French business activity types based on INSEE classifications
  export const activityTypeOptions = [
    // Construction & Building
    { value: "construction_generale", label: "General Construction" },
    { value: "gros_oeuvre", label: "Structural Work" },
    { value: "second_oeuvre", label: "Finishing Work" },
    { value: "renovation", label: "Renovation" },
    { value: "rehabilitation", label: "Rehabilitation" },
    { value: "extension", label: "Building Extension" },
    
    // Plumbing & Heating
    { value: "plomberie", label: "Plumbing" },
    { value: "chauffage", label: "Heating" },
    { value: "climatisation", label: "Air Conditioning" },
    { value: "sanitaire", label: "Sanitary Installation" },
    { value: "plomberie_chauffage", label: "Plumbing and Heating" },
    
    // Electrical
    { value: "electricite_generale", label: "General Electricity" },
    { value: "installation_electrique", label: "Electrical Installation" },
    { value: "maintenance_electrique", label: "Electrical Maintenance" },
    { value: "domotique", label: "Home Automation" },
    { value: "eclairage", label: "Lighting" },
    
    // Carpentry & Woodwork
    { value: "menuiserie", label: "Carpentry" },
    { value: "charpente", label: "Timber Framing" },
    { value: "ebenisterie", label: "Cabinetmaking" },
    { value: "parqueterie", label: "Parquetry" },
    { value: "agencement", label: "Interior Fitting" },
    
    // Roofing & Exterior
    { value: "couverture", label: "Roofing" },
    { value: "zinguerie", label: "Metal Roofing" },
    { value: "etancheite", label: "Waterproofing" },
    { value: "isolation_exterieure", label: "External Insulation" },
    { value: "ravalement", label: "Facade Restoration" },
    
    // Finishing & Interior
    { value: "peinture", label: "Painting" },
    { value: "decoration", label: "Decoration" },
    { value: "sols", label: "Flooring" },
    { value: "carrelage", label: "Tiling" },
    { value: "platrerie", label: "Plastering" },
    { value: "cloisons", label: "Partition Walls" },
    
    // Glazing & Windows
    { value: "vitrerie", label: "Glazing" },
    { value: "miroiterie", label: "Mirror Installation" },
    { value: "menuiserie_aluminium", label: "Aluminum Joinery" },
    { value: "menuiserie_pvc", label: "PVC Joinery" },
    { value: "fermetures", label: "Shutters & Blinds" },
    
    // Landscaping & Exterior
    { value: "paysagisme", label: "Landscaping" },
    { value: "jardinage", label: "Gardening" },
    { value: "elagage", label: "Tree Pruning" },
    { value: "espaces_verts", label: "Green Spaces" },
    { value: "terrassement", label: "Earthworks" },
    { value: "voirie", label: "Roadworks & Utilities" },
    
    // Cleaning & Maintenance
    { value: "nettoyage", label: "Cleaning" },
    { value: "entretien", label: "Maintenance" },
    { value: "maintenance_batiment", label: "Building Maintenance" },
    { value: "syndic", label: "Property Management" },
    { value: "gardiennage", label: "Security Guard Services" },
    
    // Security & Safety
    { value: "securite", label: "Security" },
    { value: "alarme", label: "Alarm Systems" },
    { value: "videosurveillance", label: "Video Surveillance" },
    { value: "controle_acces", label: "Access Control" },
    { value: "serrurerie", label: "Locksmithing" },
    
    // Specialized Services
    { value: "ascenseurs", label: "Elevators" },
    { value: "automatismes", label: "Automation" },
    { value: "piscines", label: "Swimming Pools" },
    { value: "spa_jacuzzi", label: "Spa & Jacuzzi" },
    { value: "fumisterie", label: "Chimney Sweeping" },
    { value: "ramonage", label: "Flue Cleaning" },
    
    // Energy & Environment
    { value: "photovoltaique", label: "Photovoltaics" },
    { value: "pompe_chaleur", label: "Heat Pumps" },
    { value: "energie_renouvelable", label: "Renewable Energy" },
    { value: "audit_energetique", label: "Energy Audit" },
    { value: "isolation", label: "Insulation" },
    
    // Moving & Transport
    { value: "demenagement", label: "Moving Services" },
    { value: "transport", label: "Transport" },
    { value: "stockage", label: "Storage" },
    { value: "manutention", label: "Handling" },
    
    // Pest Control & Hygiene
    { value: "desinsectisation", label: "Pest Control" },
    { value: "deratisation", label: "Rodent Control" },
    { value: "desinfection", label: "Disinfection" },
    { value: "hygiene", label: "Hygiene Services" },
    
    // Design & Consulting
    { value: "architecture", label: "Architecture" },
    { value: "architecte_interieur", label: "Interior Architecture" },
    { value: "bureau_etudes", label: "Engineering Office" },
    { value: "maitrise_oeuvre", label: "Project Management" },
    { value: "geometre", label: "Land Surveying" },
    
    // General Services
    { value: "multi_services", label: "Multi-Services" },
    { value: "bricolage", label: "Handyman Services" },
    { value: "depannage", label: "Emergency Repair" },
    { value: "urgences", label: "Emergency Services" },
    { value: "artisan_general", label: "General Contractor" }
  ];
  
  // Country codes
  export const countryCodeOptions = [
    { value: "+33", label: "+33 (France)" },
    { value: "+32", label: "+32 (Belgium)" },
    { value: "+41", label: "+41 (Switzerland)" },
    { value: "+49", label: "+49 (Germany)" },
    { value: "+39", label: "+39 (Italy)" },
    { value: "+34", label: "+34 (Spain)" },
    { value: "+44", label: "+44 (UK)" },
    { value: "+92", label: "+92 (Pakistan)" }
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