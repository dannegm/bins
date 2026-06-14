import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { TIPS } from '@/constants/tips';
import { cn } from '@/helpers/utils';

const INTERVAL = 4000;

export const TipsCarousel = () => {
    const [active, setActive] = useState(0);
    const $timer = useRef(null);

    const tip = TIPS[active];

    const go = index => {
        setActive((index + TIPS.length) % TIPS.length);
    };

    useEffect(() => {
        $timer.current = setInterval(() => go(active + 1), INTERVAL);
        return () => clearInterval($timer.current);
    }, [active]);

    return (
        <div
            className='relative flex flex-col gap-4 rounded-xl p-6 transition-colors duration-700'
            style={{ backgroundColor: `color-mix(in srgb, ${tip.color} 12%, transparent)` }}
        >
            <AnimatePresence mode='wait'>
                <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className='flex items-start gap-4'
                >
                    <div
                        className='flex size-10 shrink-0 items-center justify-center rounded-lg [&>svg]:size-5'
                        style={{ backgroundColor: `color-mix(in srgb, ${tip.color} 20%, transparent)`, color: tip.color }}
                    >
                        <DynamicIcon name={tip.icon} />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <span className='text-sm font-semibold text-white/90'>{tip.title}</span>
                        <span className='text-sm text-white/70'>{tip.body}</span>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className='flex gap-1.5'>
                {TIPS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => go(i)}
                        className={cn(
                            'h-1 rounded-full transition-all duration-300',
                            i === active ? 'w-4' : 'w-1 opacity-30',
                        )}
                        style={{ backgroundColor: tip.color }}
                    />
                ))}
            </div>
        </div>
    );
};
