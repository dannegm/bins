const MAX_TOKENS = 150;
const MAX_NAME_TOKENS = 30;
const MAX_EXPLAIN_TOKENS = 500;
const MAX_PREFIX = 3000;
const MAX_SUFFIX = 500;
const MAX_NAME_CONTENT = 2000;
const MAX_EXPLAIN_CONTENT = 4000;

const PROVIDERS = {
    claude: {
        url: () => 'https://api.anthropic.com/v1/messages',
        headers: ({ apiKey }) => ({
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        }),
        body: ({ model, system, user, maxTokens }) => ({
            model: model || 'claude-haiku-4-5-20251001',
            max_tokens: maxTokens,
            system,
            messages: [{ role: 'user', content: user }],
        }),
        extract: data => data.content?.[0]?.text ?? '',
    },

    openai: {
        url: () => 'https://api.openai.com/v1/chat/completions',
        headers: ({ apiKey }) => ({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        }),
        body: ({ model, system, user, maxTokens }) => ({
            model: model || 'gpt-4o-mini',
            max_tokens: maxTokens,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        }),
        extract: data => data.choices?.[0]?.message?.content ?? '',
    },

    gemini: {
        url: ({ model, apiKey }) =>
            `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
        headers: () => ({ 'Content-Type': 'application/json' }),
        body: ({ system, user, maxTokens }) => ({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: maxTokens },
        }),
        extract: data => data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
    },

    openrouter: {
        url: () => 'https://openrouter.ai/api/v1/chat/completions',
        headers: ({ apiKey }) => ({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        }),
        body: ({ model, system, user, maxTokens }) => ({
            model: model || 'anthropic/claude-haiku-4-5',
            max_tokens: maxTokens,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        }),
        extract: data => data.choices?.[0]?.message?.content ?? '',
    },

    ollama: {
        url: ({ baseUrl }) =>
            `${(baseUrl || 'http://localhost:11434').replace(/\/$/, '')}/api/chat`,
        headers: () => ({ 'Content-Type': 'application/json' }),
        body: ({ model, system, user, maxTokens }) => ({
            model: model || 'codellama',
            stream: false,
            options: { num_predict: maxTokens },
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        }),
        extract: data => data.message?.content ?? data.response ?? '',
    },
};

const callProvider = async ({ provider, model, apiKey, baseUrl, system, user, maxTokens, signal }) => {
    const def = PROVIDERS[provider];
    if (!def) return '';
    const url = def.url({ model, apiKey, baseUrl });
    const headers = def.headers({ apiKey });
    const body = def.body({ model, system, user, maxTokens });
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
    if (!res.ok) return '';
    const data = await res.json();
    return def.extract(data).trim();
};

const buildCompletionPrompt = (prefix, suffix, language) => ({
    system: 'You are a code completion assistant. Complete the code at the cursor position marked with <cursor>. Return ONLY the completion text to insert — no explanation, no markdown fences, no surrounding code.',
    user: `Language: ${language}\n\nCode:\n${prefix}<cursor>${suffix}\n\nCompletion:`,
});

const buildNamePrompt = (content, hint) => {
    const isFile = hint === 'file_name';
    return {
        system: isFile
            ? 'You are a file naming assistant. Suggest a concise, descriptive filename (including a proper extension) for the given code. Return ONLY the filename — no explanation, no quotes, no markdown, no path.'
            : 'You are a project naming assistant. Suggest a concise, descriptive title for the given code. Return ONLY the title — no explanation, no quotes, no markdown, no extra text. Max 6 words.',
        user: `Code:\n${content.slice(0, MAX_NAME_CONTENT)}\n\n${isFile ? 'Filename:' : 'Title:'}`,
    };
};

const buildExplanationPrompt = (content, language) => ({
    system: 'You are a code explanation assistant. Explain what this code does in plain language. Be concise and focus on what it does and why — not a line-by-line walkthrough. Use short paragraphs. No markdown headers or bullet points.',
    user: `Language: ${language}\n\nCode:\n${content.slice(0, MAX_EXPLAIN_CONTENT)}\n\nExplanation:`,
});

export const fetchCompletion = ({ provider, model, apiKey, baseUrl, prefix, suffix, language, signal }) => {
    const { system, user } = buildCompletionPrompt(
        prefix.slice(-MAX_PREFIX),
        suffix.slice(0, MAX_SUFFIX),
        language,
    );
    return callProvider({ provider, model, apiKey, baseUrl, system, user, maxTokens: MAX_TOKENS, signal });
};

export const fetchNameSuggestion = ({ provider, model, apiKey, baseUrl, content, hint = 'bin_title', signal }) => {
    const { system, user } = buildNamePrompt(content, hint);
    return callProvider({ provider, model, apiKey, baseUrl, system, user, maxTokens: MAX_NAME_TOKENS, signal });
};

export const fetchExplanation = ({ provider, model, apiKey, baseUrl, content, language, signal }) => {
    const { system, user } = buildExplanationPrompt(content, language);
    return callProvider({ provider, model, apiKey, baseUrl, system, user, maxTokens: MAX_EXPLAIN_TOKENS, signal });
};
