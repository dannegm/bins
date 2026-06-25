import { next } from '@vercel/edge';

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
    const { pathname, href } = new URL(request.url);
    const match = pathname.match(/^\/(editor|embed)\/([^/]+)/);
    if (!match) return next();

    const binId = match[2];

    try {
        const [[bin], files] = await Promise.all([
            dbFetch('bins', { id: `eq.${binId}`, select: 'title,author_id,visibility' }),
            dbFetch('bin_files', { bin_id: `eq.${binId}`, select: 'language' }),
        ]);

        if (!bin || bin.visibility === 'private') return next();

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

        const origin = await next();
        const html = await origin.text();
        const tags = buildMetaTags({ title, description, image, url: href });

        const headers = new Headers(origin.headers);
        headers.delete('content-length');

        return new Response(html.replace('<head>', `<head>\n${tags}`), {
            status: origin.status,
            headers,
        });
    } catch (err) {
        console.error('[middleware]', err?.message ?? err);
        return next();
    }
}

const esc = s =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function buildMetaTags({ title, description, image, url }) {
    const t = `${esc(title)} — Bins`;
    const d = esc(description);
    const i = esc(image);
    const u = esc(url);

    return [
        `<title>${t}</title>`,
        `<meta name="description" content="${d}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="Bins">`,
        `<meta property="og:url" content="${u}">`,
        `<meta property="og:title" content="${t}">`,
        `<meta property="og:description" content="${d}">`,
        `<meta property="og:image" content="${i}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${t}">`,
        `<meta name="twitter:description" content="${d}">`,
        `<meta name="twitter:image" content="${i}">`,
    ].join('\n');
}

export const config = {
    matcher: ['/editor/:path*', '/embed/:path*'],
};
