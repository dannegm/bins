import { useQueryState } from 'nuqs';
import { parseAsShorthandBoolean } from '@/helpers/parsers';
import { cn } from '@/helpers/utils';
import { sequence } from '@/helpers/arrays';

const RAINBOW = ['#FF0000', '#FF9900', '#FFFF00', '#33FF00', '#0099FF', '#9933FF'];
const SEG = 20;
const SECTIONS = 12;

export const NyanCatProvider = ({ children }) => (
    <>
        <NyanCat />
        {children}
    </>
);

export const NyanCat = () => {
    const [uwu] = useQueryState('uwu', parseAsShorthandBoolean);
    if (!uwu) return null;

    return (
        <>
            <style>{`
                @keyframes nyan-run {
                    from { transform: translateX(-20rem); }
                    to { transform: translateX(calc(100vw + 4rem)); }
                }
                @keyframes trail-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-${SEG * SECTIONS}px); }
                }
            `}</style>
            <div className='pointer-events-none fixed bottom-10 left-0 z-9999 flex items-center animate-[nyan-run_5s_linear_infinite]'>
                <div className='flex flex-col'>
                    {RAINBOW.map((color, i) => (
                        <div key={i} className='-mb-0.5 w-56 overflow-hidden'>
                            <div className='flex animate-[trail-scroll_1s_linear_infinite]'>
                                {sequence(SECTIONS * 2).map(s => (
                                    <div
                                        key={s}
                                        className={cn('h-2 w-5 shrink-0 bg-(--seg-color)', {
                                            'mt-0.5': s % 2 !== 0,
                                        })}
                                        style={{ '--seg-color': color }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <img
                    src='/images/nyan.gif'
                    alt=''
                    className='z-1 h-16 -ml-8 mt-1'
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
        </>
    );
};
