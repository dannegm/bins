const BOT_PATTERNS = [
    { pattern: /googlebot/i,          name: 'Googlebot',      color: '#4285F4', icon: 'devicon-google-plain' },
    { pattern: /gptbot/i,             name: 'GPTBot',          color: '#10A37F', icon: 'devicon-openai-plain' },
    { pattern: /claude-user|claudebot/i, name: 'Claude',       color: '#D97757' },
    { pattern: /bingbot/i,            name: 'Bingbot',         color: '#0078D4', icon: 'devicon-microsoft-plain' },
    { pattern: /duckduckbot/i,        name: 'DuckDuckBot',     color: '#DE5833' },
    { pattern: /twitterbot/i,         name: 'Twitterbot',      color: '#1DA1F2', icon: 'devicon-twitter-original' },
    { pattern: /facebookexternalhit/i, name: 'Facebookbot',    color: '#1877F2', icon: 'devicon-facebook-plain' },
    { pattern: /linkedinbot/i,        name: 'LinkedInBot',     color: '#0A66C2', icon: 'devicon-linkedin-plain' },
    { pattern: /ahrefsbot/i,          name: 'AhrefsBot',       color: '#F07629' },
    { pattern: /semrushbot/i,         name: 'SemrushBot',      color: '#FF6037' },
    { pattern: /headlesschrome/i,     name: 'Headless Chrome', color: '#9AA0A6', icon: 'devicon-chrome-plain' },
    { pattern: /heritrix/i,           name: 'Heritrix',        color: '#6B7280' },
    { pattern: /ia_archiver/i,        name: 'Alexa',           color: '#00CAFF', icon: 'devicon-amazonwebservices-plain' },
    { pattern: /bot|crawler|spider|scraper/i, name: 'Bot',     color: '#6B7280' },
];

const BROWSER_PATTERNS = [
    { pattern: /edg\//i, name: 'Edge', icon: 'devicon-windows11-plain', color: '#0078D4' },
    { pattern: /opr\//i, name: 'Opera', icon: 'devicon-opera-plain', color: '#FF1B2D' },
    { pattern: /chrome/i, name: 'Chrome', icon: 'devicon-chrome-plain', color: '#4285F4' },
    { pattern: /firefox/i, name: 'Firefox', icon: 'devicon-firefox-plain', color: '#FF7139' },
    { pattern: /safari/i, name: 'Safari', icon: 'devicon-safari-plain', color: '#006CFF' },
];

const OS_PATTERNS = [
    { pattern: /windows nt 10|windows 10|windows 11/i, name: 'Windows 10/11' },
    { pattern: /windows/i, name: 'Windows' },
    { pattern: /iphone|iphone os/i, name: 'iOS' },
    { pattern: /ipad/i, name: 'iPadOS' },
    { pattern: /android/i, name: 'Android' },
    { pattern: /mac os x|macos|macintosh/i, name: 'macOS' },
    { pattern: /cros/i, name: 'ChromeOS' },
    { pattern: /linux/i, name: 'Linux' },
];

export const parseUA = ua => {
    if (!ua) return { browser: null, os: null, device: 'unknown', bot: null };

    const bot = BOT_PATTERNS.find(b => b.pattern.test(ua));
    if (bot) return { browser: null, os: null, device: 'bot', bot };

    const browser = BROWSER_PATTERNS.find(b => b.pattern.test(ua)) ?? null;
    const os = OS_PATTERNS.find(o => o.pattern.test(ua)) ?? null;

    let device = 'desktop';
    if (/tablet|ipad/i.test(ua)) device = 'tablet';
    else if (/mobile|iphone|android(?!.*tablet)/i.test(ua)) device = 'mobile';

    return { browser, os, device, bot: null };
};

// Cron: 0 3 * * 1 — every Monday at 3am UTC
export const nextBotDeletion = () => {
    const now = new Date();
    const d = new Date(now);
    const day = d.getUTCDay(); // 0=Sun, 1=Mon

    let daysUntil;
    if (day === 1 && d.getUTCHours() < 3) {
        daysUntil = 0;
    } else {
        daysUntil = ((1 - day + 7) % 7) || 7;
    }

    d.setUTCDate(d.getUTCDate() + daysUntil);
    d.setUTCHours(3, 0, 0, 0);
    return d;
};
