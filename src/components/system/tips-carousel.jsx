import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TIPS } from '@/constants/tips';
import { Checkbox } from '@/ui/checkbox';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/helpers/utils';

const TIPS_PER_SESSION = 5;
const INTERVAL = 10000;

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

const pickTips = (exclude = []) => {
    if (TIPS.length <= TIPS_PER_SESSION) return shuffle(TIPS);
    const pool = TIPS.filter(t => !exclude.includes(t));
    return shuffle(pool.length >= TIPS_PER_SESSION ? pool : TIPS).slice(0, TIPS_PER_SESSION);
};

export const TipsCarousel = ({ onClose }) => {
    const { t } = useTranslation();
    const [tipsEnabled, setTipsEnabled] = useSettings('tipsEnabled');
    const [tips, setTips] = useState(() => pickTips());
    const [active, setActive] = useState(0);
    const [epoch, setEpoch] = useState(0);

    const isWidget = !!onClose;
    const tip = tips[active];

    useEffect(() => {
        const id = setInterval(() => setActive(i => (i + 1) % tips.length), INTERVAL);
        return () => clearInterval(id);
    }, [epoch, tips]);

    const go = index => {
        setActive((index + tips.length) % tips.length);
        setEpoch(e => e + 1);
    };

    const refresh = () => {
        setTips(prev => pickTips(prev));
        setActive(0);
        setEpoch(e => e + 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'relative flex flex-col rounded-xl transition-colors duration-700',
                'bg-(--tip-bg-light) dark:bg-(--tip-bg-dark)',
                isWidget
                    ? 'absolute bottom-3 left-3 right-3 z-10 gap-2 p-4 shadow-lg shadow-black/30 ring-1 ring-(--tip-color-light)/30 dark:ring-(--tip-color-dark)/30 sm:left-auto sm:w-104 sm:gap-4 sm:p-6'
                    : 'gap-4 p-6',
            )}
            style={{
                '--tip-color-dark': tip.color,
                '--tip-color-light': `color-mix(in srgb, ${tip.color} 80%, white)`,
                '--tip-bg-dark': `color-mix(in srgb, ${tip.color} 15%, #27272a)`,
                '--tip-bg-light': `color-mix(in srgb, ${tip.color} 20%, white)`,
                '--tip-icon-bg-dark': `color-mix(in srgb, ${tip.color} 25%, #27272a)`,
                '--tip-icon-bg-light': `color-mix(in srgb, ${tip.color} 30%, white)`,
            }}
        >
            {isWidget && (
                <button
                    onClick={onClose}
                    className='absolute top-3 right-3 rounded p-1 transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                >
                    <X className='size-3.5' />
                </button>
            )}

            <AnimatePresence mode='wait'>
                <motion.div
                    key={`${epoch}-${active}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className='flex items-start gap-3 sm:gap-4'
                >
                    <div className='flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4 sm:size-10 sm:[&>svg]:size-5 bg-(--tip-icon-bg-light) dark:bg-(--tip-icon-bg-dark) text-(--tip-color-light) dark:text-(--tip-color-dark)'>
                        <DynamicIcon name={tip.icon} />
                    </div>
                    <div className='flex flex-col gap-0.5 sm:gap-1 pr-4'>
                        <span className='text-xs font-semibold sm:text-sm text-(--tip-color-light) dark:text-(--tip-color-dark)'>
                            {tip.title}
                        </span>
                        <span className='text-xs sm:text-sm text-(--tip-color-light) dark:text-(--tip-color-dark)'>
                            {tip.body}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className='flex items-center gap-2'>
                <button
                    onClick={refresh}
                    className='transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                >
                    <RefreshCw className='size-4 sm:size-3.5' />
                </button>

                <div className='flex items-center'>
                    <button
                        onClick={() => go(active - 1)}
                        className='transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                    >
                        <ChevronLeft className='size-5 sm:size-4' />
                    </button>
                    <button
                        onClick={() => go(active + 1)}
                        className='transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                    >
                        <ChevronRight className='size-5 sm:size-4' />
                    </button>
                </div>

                <div className='flex flex-1 items-center gap-1.5'>
                    {tips.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => go(i)}
                            className={cn(
                                'h-1 rounded-full transition-all duration-300 bg-(--tip-color-light) dark:bg-(--tip-color-dark)',
                                { 'w-4': i === active, 'w-1 opacity-30': i !== active },
                            )}
                        />
                    ))}
                </div>
            </div>

            {isWidget && (
                <div className='flex items-center gap-2.5 mt-1 sm:-mt-1 opacity-70'>
                    <Checkbox
                        checked={tipsEnabled ?? true}
                        onCheckedChange={checked => setTipsEnabled(checked)}
                        id='tips-show-again'
                        className='border-[1.5px] border-(--tip-color-light) dark:border-(--tip-color-dark)'
                    />
                    <label
                        htmlFor='tips-show-again'
                        className='cursor-pointer select-none text-xs text-(--tip-color-light) dark:text-(--tip-color-dark)'
                    >
                        {t('editor.tips_widget.show_again')}
                    </label>
                </div>
            )}
        </motion.div>
    );
};
