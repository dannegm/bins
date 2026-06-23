import { next } from '@vercel/edge';

const BOT_PATTERN =
    /bot|crawl|facebookexternalhit|facebot|WhatsApp|Telegram|Slackbot|Discordbot|LinkedInBot|Twitterbot|preview/i;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const dbFetch = (table, params) =>
    fetch(`${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(params)}`, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Accept-Profile': 'bins',
        },
    });

export default async function middleware(request) {
    const ua = request.headers.get('user-agent') ?? '';
    if (!BOT_PATTERN.test(ua)) return next();

    const { pathname, href } = new URL(request.url);
    const match = pathname.match(/^\/(editor|embed)\/([^/]+)/);
    if (!match) return next();

    const binId = match[2];

    try {
        const [binRes, filesRes] = await Promise.all([
            dbFetch('bins', { id: `eq.${binId}`, select: 'title,author_id,visibility' }),
            dbFetch('bin_files', { bin_id: `eq.${binId}`, select: 'language' }),
        ]);

        const [bin] = await binRes.json();
        const files = await filesRes.json();

        if (!bin || bin.visibility === 'private') return next();

        const profileRes = await dbFetch('profiles', {
            uuid: `eq.${bin.author_id}`,
            select: 'name',
        });
        const [profile] = await profileRes.json();

        const title = bin.title?.trim() || 'Untitled';
        const author = profile?.name || 'Anonymous';
        const langs = [...new Set(files.map(f => f.language).filter(Boolean))];
        const langLabel = langs.length ? langs.join(', ') : 'code';
        const description = `A ${langLabel} bin by ${author}`;
        const image = `https://endpoints.hckr.mx/bins/bins/${binId}/preview-image.png`;

        return new Response(buildHtml({ title, description, image, url: href }), {
            headers: { 'content-type': 'text/html;charset=utf-8' },
        });
    } catch {
        return next();
    }
}

const esc = s =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function buildHtml({ title, description, image, url }) {
    const t = `${esc(title)} — Bins`;
    const d = esc(description);
    const i = esc(image);
    const u = esc(url);

    return `<!doctype html><html><head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Bins">
<meta property="og:url" content="${u}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${i}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
</head><body></body></html>`;
}

export const config = {
    matcher: ['/editor/:path*', '/embed/:path*'],
};
