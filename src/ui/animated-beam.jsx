import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/helpers/utils';

export const AnimatedBeam = ({
    containerRef,
    fromRef,
    toRef,
    curvature = 0,
    reverse = false,
    duration = 3,
    delay = 0,
    repeatDelay = 0,
    gradientStartColor = '#ffaa40',
    gradientStopColor = '#9c40ff',
    className,
    startXOffset = 0,
    startYOffset = 0,
    endXOffset = 0,
    endYOffset = 0,
}) => {
    const id = useId();
    const gradientId = `beam-g-${id.replace(/:/g, '')}`;
    const $path = useRef(null);
    const [pathD, setPathD] = useState('');
    const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
    const [pathLength, setPathLength] = useState(0);

    useEffect(() => {
        const update = () => {
            if (!containerRef?.current || !fromRef?.current || !toRef?.current) return;

            const cRect = containerRef.current.getBoundingClientRect();
            const fRect = fromRef.current.getBoundingClientRect();
            const tRect = toRef.current.getBoundingClientRect();

            const sx = fRect.left - cRect.left + fRect.width / 2 + startXOffset;
            const sy = fRect.top - cRect.top + fRect.height / 2 + startYOffset;
            const ex = tRect.left - cRect.left + tRect.width / 2 + endXOffset;
            const ey = tRect.top - cRect.top + tRect.height / 2 + endYOffset;
            const mx = (sx + ex) / 2;
            const my = (sy + ey) / 2 - curvature;

            setSvgSize({ width: cRect.width, height: cRect.height });
            setPathD(`M ${sx},${sy} Q ${mx},${my} ${ex},${ey}`);
        };

        update();
        const ro = new ResizeObserver(update);
        if (containerRef?.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset]);

    useEffect(() => {
        if ($path.current && pathD) {
            setPathLength($path.current.getTotalLength());
        }
    }, [pathD]);

    const beamLength = pathLength * 0.4;

    return (
        <svg
            fill='none'
            width={svgSize.width}
            height={svgSize.height}
            xmlns='http://www.w3.org/2000/svg'
            className={cn('pointer-events-none absolute inset-0', className)}
            viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
        >
            <defs>
                <linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='0%'>
                    <stop offset='0%' stopColor={gradientStartColor} stopOpacity='0' />
                    <stop offset='30%' stopColor={gradientStartColor} />
                    <stop offset='70%' stopColor={gradientStopColor} />
                    <stop offset='100%' stopColor={gradientStopColor} stopOpacity='0' />
                </linearGradient>
            </defs>

            {/* Static faint track */}
            <path
                d={pathD}
                strokeWidth='2'
                stroke='currentColor'
                strokeOpacity='0.15'
                strokeLinecap='round'
                className='text-foreground'
            />

            {/* Animated beam */}
            <motion.path
                ref={$path}
                d={pathD}
                strokeWidth='2'
                stroke={`url(#${gradientId})`}
                strokeLinecap='round'
                strokeDasharray={pathLength > 0 ? `${beamLength} ${pathLength}` : undefined}
                initial={{ strokeDashoffset: reverse ? -pathLength : beamLength }}
                animate={{ strokeDashoffset: reverse ? beamLength : -pathLength }}
                transition={{
                    delay,
                    duration,
                    ease: [0.16, 1, 0.3, 1],
                    repeat: Infinity,
                    repeatDelay,
                }}
            />
        </svg>
    );
};
