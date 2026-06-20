import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCode, ArrowLeft, ArrowRight, RotateCcw, House } from 'lucide-react';

const INJECTED_SCRIPT = `<script>
(function () {
    function notify() {
        window.parent.postMessage({ type: 'bins:title', title: document.title }, '*');
    }
    new MutationObserver(notify).observe(document.documentElement, {
        subtree: true, childList: true, characterData: true,
    });
    window.addEventListener('message', function (e) {
        if (e.data?.type === 'bins:back') history.back();
        if (e.data?.type === 'bins:forward') history.forward();
        if (e.data?.type === 'bins:reload') location.reload();
    });
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (!a) return;
        var href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            var target = document.getElementById(href.slice(1));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
    });
    notify();
})();
</script>`;

const injectScript = html => {
    if (html.includes('</head>')) return html.replace('</head>', INJECTED_SCRIPT + '</head>');
    return INJECTED_SCRIPT + html;
};

const parseHtmlMeta = html => {
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const title = doc.querySelector('title')?.textContent?.trim() || null;
        const iconHref = doc.querySelector('link[rel~="icon"]')?.getAttribute('href') || null;
        const favicon = iconHref?.startsWith('data:') || iconHref?.startsWith('http') ? iconHref : null;
        return { title, favicon };
    } catch {
        return { title: null, favicon: null };
    }
};

const NavButton = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className='rounded p-1 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
    >
        {children}
    </button>
);

export const HtmlRunner = ({ content }) => {
    const { t } = useTranslation();
    const $iframe = useRef(null);
    const [liveTitle, setLiveTitle] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const { title, favicon } = useMemo(() => parseHtmlMeta(content ?? ''), [content]);
    const srcDoc = useMemo(() => injectScript(content ?? ''), [content]);

    useEffect(() => { setLiveTitle(null); }, [content]);

    useEffect(() => {
        const handler = e => {
            if (e.source !== $iframe.current?.contentWindow) return;
            if (e.data?.type === 'bins:title') setLiveTitle(e.data.title || null);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const post = type => $iframe.current?.contentWindow?.postMessage({ type }, '*');

    const displayTitle = liveTitle ?? title;

    return (
        <div className='flex h-full flex-col'>
            <div className='flex h-10 shrink-0 items-center gap-1.5 border-b border-border px-3'>
                <NavButton onClick={() => post('bins:back')}>
                    <span className='[&>svg]:size-3.5'><ArrowLeft /></span>
                </NavButton>
                <NavButton onClick={() => post('bins:forward')}>
                    <span className='[&>svg]:size-3.5'><ArrowRight /></span>
                </NavButton>
                <NavButton onClick={() => setReloadKey(k => k + 1)}>
                    <span className='[&>svg]:size-3.5'><House /></span>
                </NavButton>

                <div className='flex min-w-0 flex-1 justify-center'>
                    <div className='flex min-w-0 flex-1 items-center gap-1.5 rounded-sm bg-surface-raised px-2.5 py-0.5'>
                        {favicon ? (
                            <img src={favicon} className='size-3 shrink-0' alt='' />
                        ) : (
                            <span className='shrink-0 [&>svg]:size-3'>
                                <FileCode className='text-muted-foreground' />
                            </span>
                        )}
                        <span className='truncate text-xs text-foreground'>
                            {displayTitle || t('editor.runner_panel.html.untitled')}
                        </span>
                    </div>
                </div>

                <NavButton onClick={() => post('bins:reload')}>
                    <span className='[&>svg]:size-3.5'><RotateCcw /></span>
                </NavButton>
            </div>
            <iframe
                key={reloadKey}
                ref={$iframe}
                className='min-h-0 flex-1 w-full border-0'
                sandbox='allow-scripts allow-forms allow-modals'
                srcDoc={srcDoc}
            />
        </div>
    );
};
