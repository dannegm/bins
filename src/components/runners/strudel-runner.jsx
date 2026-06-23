import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Square, Music2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';

// Heavy package — lazy-loaded once and reused across mounts
let strudelReady = null;
const loadStrudel = () => {
    if (!strudelReady) {
        strudelReady = import('@strudel/web').then(({ initStrudel }) => initStrudel());
    }
    return strudelReady;
};

const hapLabel = hap => {
    const v = hap.value;
    if (v == null) return '?';
    if (typeof v !== 'object') return String(v);
    return String(v.note ?? v.n ?? v.s ?? v.sound ?? Object.values(v)[0] ?? '?');
};

const hapHue = hap => {
    const label = hapLabel(hap);
    const hash = [...label].reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0);
    return (hash * 137) % 360;
};

// Assign non-overlapping haps to rows (greedy interval scheduling)
const assignTracks = haps => {
    const tracks = [];
    const sorted = [...haps].sort((a, b) => Number(a.part.begin) - Number(b.part.begin));
    for (const hap of sorted) {
        const begin = Number(hap.part.begin);
        let idx = tracks.findIndex(t => Number(t.at(-1).part.end) <= begin);
        if (idx === -1) {
            idx = tracks.length;
            tracks.push([]);
        }
        tracks[idx].push(hap);
    }
    return tracks;
};

const HapBlock = ({ hap, progress }) => {
    const begin = Number(hap.part.begin);
    const end = Number(hap.part.end);
    const width = Math.max(end - begin, 0.025);
    const isActive = progress >= begin && progress < end;

    return (
        <div
            className={cn(
                'absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden transition-all duration-75',
                'bg-(--hap-bg) left-(--hap-left) w-(--hap-width)',
                { 'ring-1 ring-white/30': isActive, 'opacity-50': !isActive },
            )}
            style={{
                '--hap-bg': `hsl(${hapHue(hap)}, 62%, 50%)`,
                '--hap-left': `${begin * 100}%`,
                '--hap-width': `${width * 100}%`,
            }}
        >
            <span className='truncate px-1 font-mono text-[9px] font-medium text-white select-none'>
                {hapLabel(hap)}
            </span>
        </div>
    );
};

const PatternViz = ({ haps, progress }) => {
    const tracks = assignTracks(haps);

    return (
        <div className='flex flex-col gap-1.5 px-4 py-3'>
            {tracks.map((track, ti) => (
                <div key={ti} className='relative h-8 rounded-md bg-surface overflow-hidden'>
                    {track.map((hap, hi) => (
                        <HapBlock key={hi} hap={hap} progress={progress} />
                    ))}
                    <div
                        className='pointer-events-none absolute inset-y-0 z-10 w-px bg-brand/80 left-(--progress)'
                        style={{ '--progress': `${progress * 100}%` }}
                    />
                </div>
            ))}
        </div>
    );
};

const ParseError = ({ message }) => (
    <div className='flex gap-2 px-4 py-3 font-mono text-xs text-destructive'>
        <span className='shrink-0 select-none'>✕</span>
        <span className='min-w-0 whitespace-pre-wrap break-all'>{message}</span>
    </div>
);

const IdleState = ({ onPlay, t }) => (
    <div className='flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center'>
        <div className='relative flex items-center justify-center'>
            <div className='absolute size-16 rounded-full bg-brand/10 blur-xl' />
            <div className='relative flex size-12 items-center justify-center rounded-full bg-brand/15 text-brand'>
                <Music2 className='size-6' />
            </div>
        </div>

        <div className='flex flex-col gap-1'>
            <span className='text-base font-semibold text-foreground'>
                {t('editor.runner_panel.strudel.idle_title')}
            </span>
            <span className='text-xs font-medium text-brand'>
                {t('editor.runner_panel.strudel.idle_tagline')}
            </span>
            <p className='mt-1 text-xs leading-relaxed whitespace-pre-line text-muted-foreground'>
                {t('editor.runner_panel.strudel.idle_description')}
            </p>
        </div>

        <button
            onClick={onPlay}
            className='flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-75'
        >
            <Play className='size-3.5 fill-current' />
            {t('editor.runner_panel.strudel.play')}
        </button>
    </div>
);

export const StrudelRunner = ({ content }) => {
    const { t } = useTranslation();
    const $repl = useRef(null);
    const $raf = useRef(null);
    const $playStart = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [hasCanvas, setHasCanvas] = useState(false);
    const [error, setError] = useState(null);
    const [haps, setHaps] = useState(null);
    const [progress, setProgress] = useState(0);
    const [cycle, setCycle] = useState(0);
    const [bpm, setBpm] = useState(120);

    useEffect(() => {
        loadStrudel().then(repl => {
            $repl.current = repl;
        });

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.tagName === 'CANVAS' && node.id) setHasCanvas(true);
                }
                for (const node of mutation.removedNodes) {
                    if (node.tagName === 'CANVAS' && node.id) setHasCanvas(false);
                }
            }
        });
        observer.observe(document.body, { childList: true });

        return () => {
            observer.disconnect();
            $repl.current?.stop();
            cancelAnimationFrame($raf.current);
            document.querySelectorAll('body > canvas[id]').forEach(c => c.remove());
        };
    }, []);

    const startRaf = cps => {
        const startedAt = performance.now();
        $playStart.current = startedAt;

        const tick = () => {
            const elapsed = (performance.now() - startedAt) / 1000;
            const totalCycles = elapsed * ($repl.current?.scheduler?.cps ?? cps);
            setProgress(totalCycles % 1);
            setCycle(Math.floor(totalCycles));
            if ($repl.current?.scheduler?.cps) {
                setBpm(Math.round($repl.current.scheduler.cps * 60));
            }
            $raf.current = requestAnimationFrame(tick);
        };
        $raf.current = requestAnimationFrame(tick);
    };

    const handlePlay = async () => {
        const repl = $repl.current;
        if (!repl) return;

        setError(null);

        try {
            await repl.evaluate(content, true);

            if (repl.state.evalError) throw repl.state.evalError;

            const pat = repl.state.pattern;
            const rawHaps = pat?.queryArc(0, 1) ?? [];
            setHaps(rawHaps);
            setIsPlaying(true);
            startRaf(repl.scheduler.cps ?? 0.5);
        } catch (e) {
            setError(e?.message ?? String(e));
            setIsPlaying(false);
            cancelAnimationFrame($raf.current);
        }
    };

    const handleStop = () => {
        $repl.current?.stop();
        setIsPlaying(false);
        setProgress(0);
        cancelAnimationFrame($raf.current);
        document.querySelectorAll('body > canvas[id]').forEach(c => c.remove());
    };

    return (
        <div className='flex h-full flex-col'>
            {hasCanvas && [
                createPortal(
                    <button className='fixed bottom-16 right-4 z-300 flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-xs font-medium text-white shadow-lg shadow-black/30 transition-opacity hover:opacity-90 active:opacity-75 sm:bottom-6'>
                        <Square className='size-3 fill-current' />
                        {t('editor.runner_panel.strudel.stop')}
                    </button>,
                    document.body,
                ),
                <button
                    onClick={handleStop}
                    className='fixed bottom-16 right-4 z-max px-4 py-2 sm:bottom-6 opacity-0'
                >
                    <Square className='size-3' />
                    {t('editor.runner_panel.strudel.stop')}
                </button>,
            ]}

            {error ? (
                <ParseError message={error} />
            ) : haps?.length ? (
                <PatternViz haps={haps} progress={progress} />
            ) : (
                <IdleState onPlay={handlePlay} t={t} />
            )}

            <div className='mt-auto shrink-0 border-t border-border px-4 py-3 flex items-center gap-3'>
                <button
                    onClick={isPlaying ? handleStop : handlePlay}
                    className='flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 active:opacity-75'
                >
                    {isPlaying ? (
                        <Square className='size-3 fill-current' />
                    ) : (
                        <Play className='size-3 fill-current' />
                    )}
                    {isPlaying
                        ? t('editor.runner_panel.strudel.stop')
                        : t('editor.runner_panel.strudel.play')}
                </button>

                {isPlaying && (
                    <>
                        <span className='font-mono text-xs text-muted-foreground'>
                            ♩ {bpm} {t('editor.runner_panel.strudel.bpm')}
                        </span>
                        <span className='ml-auto font-mono text-xs text-muted-foreground'>
                            {t('editor.runner_panel.strudel.cycle')} {cycle}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
