import { useState, useEffect } from 'react';
import { Bot, Monitor } from 'lucide-react';
import { cn } from '@/helpers/utils';
import { AppIcon } from '@/components/layout/app-icon';

const Bone = ({ className }) => <div className={cn('rounded-md bg-muted', className)} />;

const DummySidebar = () => (
    <aside className='fixed bottom-0 left-0 right-0 z-40 flex h-14 flex-row items-center justify-evenly border-t border-sidebar-border bg-sidebar px-2 sm:relative sm:h-screen sm:w-14 sm:flex-col sm:justify-start sm:gap-2 sm:border-r sm:border-t-0 sm:px-0 sm:py-4 short:hidden sm:short:flex'>
        <AppIcon />
        <div className='hidden sm:block border-t border-foreground/5 my-2 w-full' />
        <Bone className='size-9 rounded-lg' />
        <Bone className='size-9 rounded-lg' />
        <div className='hidden sm:flex flex-1' />
        <div className='hidden sm:block border-t border-foreground/5 my-2 w-full' />
        <Bone className='size-9 rounded-lg' />
        <Bone className='size-9 rounded-lg' />
    </aside>
);

const DummyHeader = () => (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
        <div className='flex items-center gap-3 sm:flex-1'>
            <Bone className='h-9 flex-1 rounded-lg' />
            <Bone className='h-9 w-28 shrink-0 rounded-lg' />
        </div>
        <div className='flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 sm:order-first sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0'>
            <Bone className='size-9 shrink-0 rounded-full' />
            <div className='flex min-w-0 flex-col gap-2'>
                <Bone className='h-3.5 w-24' />
                <Bone className='h-5 w-36 rounded-full' />
            </div>
        </div>
    </div>
);

const DummyCarousel = () => (
    <div className='flex flex-col gap-4 rounded-xl bg-indigo-200 dark:bg-indigo-950 p-6'>
        <div className='flex items-start gap-4'>
            <Bone className='size-10 shrink-0 rounded-lg bg-foreground/10' />
            <div className='flex flex-1 flex-col gap-2'>
                <Bone className='h-3.5 w-32 bg-foreground/10' />
                <Bone className='h-3 w-full bg-foreground/10' />
                <Bone className='h-3 w-4/5 bg-foreground/10' />
            </div>
        </div>
        <div className='flex items-center gap-1.5'>
            <Bone className='h-1 w-4 rounded-full bg-foreground/10' />
            {Array.from({ length: 4 }).map((_, i) => (
                <Bone key={i} className='size-1 rounded-full bg-foreground/10' />
            ))}
        </div>
    </div>
);

const BinCardBone = () => (
    <div className='flex flex-col gap-3 rounded-xl border border-border bg-card p-4'>
        <div className='flex items-start justify-between gap-2'>
            <Bone className='h-4 w-3/5' />
            <Bone className='h-4 w-10 rounded-full' />
        </div>
        <div className='flex items-center gap-2'>
            <div className='flex items-center'>
                <Bone className='size-4 rounded-full ring-2 ring-background' />
                <Bone className='size-4 rounded-full ring-2 ring-background' />
            </div>
            <Bone className='h-3 w-8' />
            <Bone className='h-3 w-8 ml-auto' />
        </div>
    </div>
);

const DummySection = ({ count = 4 }) => (
    <div className='flex flex-col gap-4'>
        <Bone className='h-3 w-20' />
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: count }).map((_, i) => (
                <BinCardBone key={i} />
            ))}
        </div>
    </div>
);

const DummyFooter = () => (
    <div className='flex items-center gap-2 border-t border-border px-8 py-4 mb-1'>
        <Bone className='h-3 w-48' />
        <div className='flex-grow' />
        <Bone className='h-3 w-8' />
    </div>
);

const HeadlessNotice = () => (
    <div className='mx-8 mb-8 flex items-center gap-4 rounded-xl border border-brand/30 bg-brand/5 px-6 py-5'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand'>
            <Bot className='size-5' />
        </div>
        <div className='flex flex-col gap-0.5'>
            <span className='text-base font-semibold text-brand'>You're a headless browser.</span>
            <span className='text-sm text-muted-foreground'>
                This view exists only for automated crawlers and bots. If you're a real person
                seeing this, congrats — you found the ghost mode.
            </span>
        </div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className='flex items-baseline gap-2'>
        <span className='w-36 shrink-0 text-sm text-muted-foreground'>{label}</span>
        <span className='font-mono text-sm text-foreground'>{value ?? '—'}</span>
    </div>
);

const BrowserInfo = ({ className }) => {
    const [info, setInfo] = useState(null);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        setInfo({
            browser: document.documentElement.getAttribute('data-browser'),
            os: document.documentElement.getAttribute('data-os'),
            device: document.documentElement.getAttribute('data-device'),
            screenW: window.screen.width,
            screenH: window.screen.height,
            viewportW: window.innerWidth,
            viewportH: window.innerHeight,
            dpr: window.devicePixelRatio,
            colorScheme: mq.matches ? 'dark' : 'light',
            lang: navigator.language,
            langs: navigator.languages?.join(', '),
            online: navigator.onLine ? 'yes' : 'no',
            ua: navigator.userAgent,
        });
    }, []);

    if (!info) return null;

    return (
        <div className={className}>
            <div className='flex flex-col gap-4 rounded-xl border border-border bg-card p-6'>
                <div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
                    <Monitor className='size-4 text-brand' />
                    Environment
                </div>
                <div className='grid grid-cols-1 gap-y-2 sm:grid-cols-2'>
                    <InfoRow label='Browser' value={info.browser} />
                    <InfoRow label='OS' value={info.os} />
                    <InfoRow label='Device' value={info.device} />
                    <InfoRow label='Color scheme' value={info.colorScheme} />
                    <InfoRow label='Language' value={info.lang} />
                    <InfoRow label='Languages' value={info.langs} />
                    <InfoRow label='Screen' value={`${info.screenW} × ${info.screenH}`} />
                    <InfoRow label='Viewport' value={`${info.viewportW} × ${info.viewportH}`} />
                    <InfoRow label='Device pixel ratio' value={info.dpr} />
                    <InfoRow label='Online' value={info.online} />
                </div>
                <InfoRow label='User agent' value={info.ua} />
            </div>
        </div>
    );
};

export const DummyPage = () => (
    <div className='flex h-screen bg-background'>
        <DummySidebar />
        <main className='flex-1 overflow-y-auto pb-14 sm:pb-0 short:pb-0'>
            <div className='flex h-full flex-col'>
                <div className='flex flex-1 flex-col gap-8 overflow-y-auto p-8'>
                    <DummyHeader />
                    <DummyCarousel />
                    <DummySection count={4} />
                    <DummySection count={2} />
                    <BrowserInfo />
                </div>

                <HeadlessNotice />

                <DummyFooter />
            </div>
        </main>
    </div>
);
