const BOT_PATTERN =
    /bot|crawl|facebookexternalhit|facebot|WhatsApp|Telegram|Slackbot|Discordbot|LinkedInBot|Twitterbot|preview/i;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const dbFetch = async (table, params) => {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(params)}`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Accept-Profile': 'bins',
                Accept: 'application/json',
            },
        },
    );
    if (!res.ok) throw new Error(`[${table}] ${res.status} ${await res.text()}`);
    return res.json();
};

export default async function middleware(request) {
    const ua = request.headers.get('user-agent') ?? '';
    if (!BOT_PATTERN.test(ua)) {
        console.log('[middleware] skipped — ua:', ua);
        return;
    }

    const { pathname, href } = new URL(request.url);
    const match = pathname.match(/^\/(editor|embed)\/([^/]+)/);
    if (!match) {
        console.log('[middleware] skipped — no path match:', pathname);
        return;
    }

    console.log('[middleware] handling bot request:', pathname);

    const binId = match[2];

    try {
        const [[bin], files] = await Promise.all([
            dbFetch('bins', { id: `eq.${binId}`, select: 'title,author_id,visibility' }),
            dbFetch('bin_files', { bin_id: `eq.${binId}`, select: 'language' }),
        ]);

        if (!bin || bin.visibility === 'private') return;

        const [profile] = await dbFetch('profiles', {
            uuid: `eq.${bin.author_id}`,
            select: 'name',
        });

        const title = bin.title?.trim() || 'Untitled';
        const author = profile?.name || 'Anonymous';
        const langs = [...new Set(files.map(f => f.language).filter(Boolean))];
        const langLabel = langs.length ? langs.join(', ') : 'code';
        const description = `A ${langLabel} bin by ${author}`;
        const image = `https://endpoints.hckr.mx/bins/bins/${binId}/preview-image.png`;

        return new Response(buildHtml({ title, description, image, url: href }), {
            headers: { 'content-type': 'text/html;charset=utf-8' },
        });
    } catch (err) {
        const msg = err?.message ?? String(err);
        console.error('[middleware]', msg);
        return new Response(`<!doctype html><html><head></head><body><!-- middleware error: ${msg.replace(/--/g, '-')} --></body></html>`, {
            headers: { 'content-type': 'text/html;charset=utf-8' },
        });
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
