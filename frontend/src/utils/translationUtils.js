
// Helper function to map step names to translation keys
export const getStepTranslationKey = (stepName) => {
    if (!stepName) return null;
    const normalized = stepName.toString().trim().toLowerCase();
    const mapping = {
        'step 1': 'project_creation.step_1',
        'step 2': 'project_creation.step_2',
        'step 3': 'project_creation.step_3',
        'quote acceptance': 'project_steps.quote_acceptance',
        'project start': 'project_steps.project_start',
        'project completion': 'project_steps.project_completion',
    };
    return mapping[normalized] || null;
};
