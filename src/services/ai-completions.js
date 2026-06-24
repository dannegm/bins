const MAX_PREFIX = 3000;
const MAX_SUFFIX = 500;
const MAX_TOKENS = 150;

const buildPrompt = (prefix, suffix, language) => {
    const system =
        'You are a code completion assistant. Complete the code at the cursor position marked with <cursor>. Return ONLY the completion text to insert — no explanation, no markdown fences, no surrounding code.';
    const user = `Language: ${language}\n\nCode:\n${prefix}<cursor>${suffix}\n\nCompletion:`;
    return { system, user };
};

const extractText = (data, provider) => {
    switch (provider) {
        case 'claude':
            return data.content?.[0]?.text ?? '';
        case 'openai':
        case 'openrouter':
            return data.choices?.[0]?.message?.content ?? '';
        case 'gemini':
            return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        case 'ollama':
            return data.message?.content ?? data.response ?? '';
        default:
            return '';
    }
};

export const fetchCompletion = async ({
    provider,
    model,
    apiKey,
    baseUrl,
    prefix,
    suffix,
    language,
    signal,
}) => {
    const trimmedPrefix = prefix.slice(-MAX_PREFIX);
    const trimmedSuffix = suffix.slice(0, MAX_SUFFIX);
    const { system, user } = buildPrompt(trimmedPrefix, trimmedSuffix, language);

    let url, headers, body;

    switch (provider) {
        case 'claude':
            url = 'https://api.anthropic.com/v1/messages';
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            };
            body = {
                model: model || 'claude-haiku-4-5-20251001',
                max_tokens: MAX_TOKENS,
                system,
                messages: [{ role: 'user', content: user }],
            };
            break;

        case 'openai':
            url = 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            };
            body = {
                model: model || 'gpt-4o-mini',
                max_tokens: MAX_TOKENS,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
            };
            break;

        case 'gemini': {
            const geminiModel = model || 'gemini-2.0-flash';
            url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
            headers = { 'Content-Type': 'application/json' };
            body = {
                systemInstruction: { parts: [{ text: system }] },
                contents: [{ role: 'user', parts: [{ text: user }] }],
                generationConfig: { maxOutputTokens: MAX_TOKENS },
            };
            break;
        }

        case 'openrouter':
            url = 'https://openrouter.ai/api/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            };
            body = {
                model: model || 'anthropic/claude-haiku-4-5',
                max_tokens: MAX_TOKENS,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
            };
            break;

        case 'ollama':
            url = `${(baseUrl || 'http://localhost:11434').replace(/\/$/, '')}/api/chat`;
            headers = { 'Content-Type': 'application/json' };
            body = {
                model: model || 'codellama',
                stream: false,
                options: { num_predict: MAX_TOKENS },
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
            };
            break;

        default:
            return '';
    }

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
    if (!res.ok) return '';
    const data = await res.json();
    return extractText(data, provider).trim();
};
