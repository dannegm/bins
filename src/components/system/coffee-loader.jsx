import { cn } from '@/helpers/utils';
import { useRef, useEffect } from 'react';

const withAlpha = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

const draw = (ctx, size, t, color) => {
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;
    const px = size > 30 ? 2 : 1;

    const dot = (x, y, a) => {
        ctx.fillStyle = withAlpha(color, a);
        ctx.fillRect(Math.round(cx + x * px), Math.round(cy + y * px), px, px);
    };

    // Cup body
    [
        [-3, 0],
        [-2, 0],
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [-3, 1],
        [-2, 1],
        [-1, 1],
        [0, 1],
        [1, 1],
        [2, 1],
        [3, 1],
        [-3, 2],
        [-2, 2],
        [-1, 2],
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
        [-3, 3],
        [-2, 3],
        [-1, 3],
        [0, 3],
        [1, 3],
        [2, 3],
        [3, 3],
    ].forEach(([x, y]) => dot(x, y, 0.62));

    // Cup rim
    [
        [-3, -1],
        [-2, -1],
        [-1, -1],
        [0, -1],
        [1, -1],
        [2, -1],
        [3, -1],
    ].forEach(([x, y]) => dot(x, y, 0.72));

    // Cup bottom
    [
        [-2, 4],
        [-1, 4],
        [0, 4],
        [1, 4],
        [2, 4],
    ].forEach(([x, y]) => dot(x, y, 0.65));

    // Handle
    [
        [4, 0],
        [5, 0],
        [5, 1],
        [5, 2],
        [5, 3],
        [5, 4],
        [4, 4],
        [4, 1],
        [4, 3],
    ].forEach(([x, y]) => dot(x, y, 0.58));

    // Liquid surface highlight
    [
        [-2, 0],
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0],
    ].forEach(([x, y]) => dot(x, y, 0.82));

    // Steam
    const maxH = size > 30 ? 11 : 7;
    [
        { sx: -1.5, speed: 75e-5, phOff: 0 },
        { sx: 0, speed: 7e-4, phOff: 2.2 },
        { sx: 1.5, speed: 8e-4, phOff: 4.4 },
    ].forEach(({ sx, speed, phOff }) => {
        const phase = t * speed + phOff;
        const rise = (Math.sin(phase) + 1) / 2;
        const h = Math.round(rise * maxH);

        for (let i = 0; i <= h; i++) {
            const a = i / maxH;
            const wave = 1.5 * Math.sin(1.2 * phase + a * Math.PI * 1.8);
            const alpha = (1 - a) * 0.48 * rise;
            if (alpha <= 0.03) continue;

            ctx.fillStyle = withAlpha(color, alpha);
            ctx.fillRect(Math.round(cx + (sx + wave) * px), Math.round(cy + (-2 - i) * px), px, px);

            if (i > 0) {
                const prevWave = 1.5 * Math.sin(1.2 * phase + (a - 1 / maxH) * Math.PI * 1.8);
                if (Math.abs(Math.round((wave - prevWave) * px)) > px) {
                    ctx.fillStyle = withAlpha(color, 0.65 * alpha);
                    ctx.fillRect(
                        Math.round(cx + (sx + (wave + prevWave) / 2) * px),
                        Math.round(cy + (-2 - i) * px),
                        px,
                        px,
                    );
                }
            }
        }
    });
};

export default function CoffeeLoader({ className }) {
    const $canvas = useRef(null);

    useEffect(() => {
        const cv = $canvas.current;
        if (!cv) return;
        const SC = window.devicePixelRatio || 2;
        cv.width = 64 * SC;
        cv.height = 64 * SC;
        const ctx = cv.getContext('2d');
        ctx.scale(SC, SC);
        const color =
            getComputedStyle(cv).getPropertyValue('--muted-foreground').trim() || '#949494';
        const t0 = performance.now();
        let raf;
        const loop = () => {
            draw(ctx, 64, performance.now() - t0, color);
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            className={cn(
                'flex-center size-16 bg-radial from-background to-transparent',
                className,
            )}
        >
            <canvas
                ref={$canvas}
                className={cn('size-full image-pixelated translate-x-[-2%] translate-y-[-4%]')}
            />
        </div>
    );
}
