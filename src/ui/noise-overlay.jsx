import { useEffect, useRef } from 'react';
import { cn } from '@/helpers/utils';

const useNoise = $canvas => {
    useEffect(() => {
        const canvas = $canvas.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let frame;
        let last = 0;

        const draw = now => {
            frame = requestAnimationFrame(draw);
            if (now - last < 50) return;
            last = now;
            const img = ctx.createImageData(canvas.width, canvas.height);
            for (let i = 0; i < img.data.length; i += 4) {
                const v = Math.random() * 255;
                img.data[i] = v;
                img.data[i + 1] = v;
                img.data[i + 2] = v;
                img.data[i + 3] = 255;
            }
            ctx.putImageData(img, 0, 0);
        };

        frame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frame);
    }, []);
};

export const NoiseOverlay = ({ resolution = 300, className }) => {
    const $canvas = useRef(null);
    useNoise($canvas);
    return (
        <canvas
            ref={$canvas}
            width={resolution}
            height={resolution}
            className={cn('pointer-events-none absolute inset-0 h-full w-full opacity-5', className)}
            style={{ imageRendering: 'pixelated' }}
        />
    );
};
