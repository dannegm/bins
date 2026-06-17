import { useRef, useEffect } from 'react';
import { motion, useAnimate } from 'motion/react';
import { useListener } from '@/providers/bus-provider';

const randShake = (steps, maxAmp) => {
    const frames = [0];
    for (let i = 1; i < steps - 1; i++) {
        const amp = maxAmp * (1 - i / steps);
        frames.push((Math.random() * 2 - 1) * amp);
    }
    frames.push(0);
    return frames;
};

export const NudgeProvider = ({ children }) => {
    const [scope, animate] = useAnimate();
    const $audio = useRef(null);

    useEffect(() => {
        $audio.current = new Audio('/sounds/nudge.mp3');
        $audio.current.preload = 'auto';
    }, []);

    useListener('peer:nudge:received', async () => {
        navigator.vibrate?.([80, 40, 60, 30, 50, 20, 40, 15, 30, 10]);
        $audio.current.currentTime = 0;
        $audio.current.play();
        await animate(
            scope.current,
            { x: randShake(10, 14), y: randShake(10, 14) },
            { duration: 0.6, ease: 'easeOut' },
        );
    });

    return (
        <motion.div
            ref={scope}
            className='flex h-dvh sm:h-full w-full flex-col ring-2 ring-border rounded-xs overflow-hidden'
        >
            {children}
        </motion.div>
    );
};
