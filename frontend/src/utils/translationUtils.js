
// Helper function to map step names to translation keys
export const getStepTranslationKey = (stepName) => {
    if (!stepName) return null;
    const normalized = stepName.toString().trim().toLowerCase();
    const mapping = {
        'step 1': 'project_creation.step_1',
        'étape 1': 'project_creation.step_1',
        'step 2': 'project_creation.step_2',
        'étape 2': 'project_creation.step_2',
        'step 3': 'project_creation.step_3',
        'étape 3': 'project_creation.step_3',
        'quote acceptance': 'project_steps.quote_acceptance',
        'project start': 'project_steps.project_start',
        'project completion': 'project_steps.project_completion',
    };
    return mapping[normalized] || null;
};

// Helper function to map default installment descriptions to translation keys
export const getDescriptionTranslationKey = (description) => {
    if (!description) return null;
    const normalized = description.toString().trim().toLowerCase();
    const mapping = {
        'full payment upon quote acceptance.': 'project_creation.desc_full_payment',
        "paiement intégral à l'acceptation du devis.": 'project_creation.desc_full_payment',
        'initial payment upon quote acceptance.': 'project_creation.desc_initial_payment',
        "paiement initial à l'acceptation du devis.": 'project_creation.desc_initial_payment',
        'payment due at the start of the project.': 'project_creation.desc_start_payment',
        'paiement dû au début du projet.': 'project_creation.desc_start_payment',
        'final payment upon project completion.': 'project_creation.desc_final_payment',
        'paiement final à la fin du projet.': 'project_creation.desc_final_payment'
    };
    return mapping[normalized] || null;
};
