export const isAiConfigured = aiCompletions => {
    if (!aiCompletions) return false;
    return aiCompletions.provider === 'ollama' || !!aiCompletions.apiKey?.trim();
};

export const isAiEnabled = aiCompletions =>
    !!aiCompletions?.enabled && isAiConfigured(aiCompletions);
