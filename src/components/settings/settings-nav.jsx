import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';

const NAV_SECTIONS = [
    'identity',
    'appearance',
    'editor',
    'keybindings',
    'prettier',
    'ai-completions',
    'import-export',
];

const NavItem = ({ sectionId, active, label, onClick }) => (
    <button
        type='button'
        onClick={() => onClick(sectionId)}
        className={cn('w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors', {
            'bg-muted font-medium text-foreground': active,
            'text-muted-foreground hover:text-foreground': !active,
        })}
    >
        {label}
    </button>
);

export const SettingsNav = ({ scrollContainerRef }) => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState(NAV_SECTIONS[0]);
    const observerRef = useRef(null);

    useEffect(() => {
        const container = scrollContainerRef?.current;
        if (!container) return;

        const sections = NAV_SECTIONS.map(id => document.getElementById(`settings-${id}`)).filter(
            Boolean,
        );

        observerRef.current = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id.replace('settings-', ''));
                    }
                }
            },
            { root: container, rootMargin: '-20% 0px -60% 0px', threshold: 0 },
        );

        sections.forEach(el => observerRef.current.observe(el));
        return () => observerRef.current?.disconnect();
    }, [scrollContainerRef]);

    const scrollTo = sectionId => {
        const el = document.getElementById(`settings-${sectionId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <nav className='hidden w-44 shrink-0 flex-col gap-0.5 border-r border-border px-3 py-8 sm:flex'>
            {NAV_SECTIONS.map(id => (
                <NavItem
                    key={id}
                    sectionId={id}
                    active={activeSection === id}
                    label={t(`settings.nav.${id.replaceAll('-', '_')}`)}
                    onClick={scrollTo}
                />
            ))}
        </nav>
    );
};
