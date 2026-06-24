import { useState, useEffect, useCallback } from 'react';
import { Search, X, Star, StarOff, Plus, Trash2, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/ui/drawer';
import { usePackagesPanel } from '@/providers/packages-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/hooks/use-settings';
import { settings } from '@/services/settings';
import { updateBin } from '@/services/bins';
import { cn } from '@/helpers/utils';

const NPM_SEARCH_URL = 'https://registry.npmjs.org/-/v1/search';

const useNpmSearch = query => {
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${NPM_SEARCH_URL}?text=${encodeURIComponent(query)}&size=8`);
                const data = await res.json();
                setResults(data.objects?.map(o => o.package) ?? []);
            } catch {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [query]);

    return { results, isSearching };
};

const PackageRow = ({ name, description, version, actions }) => (
    <div className='flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-raised transition-colors'>
        <div className='min-w-0 flex-1'>
            <div className='flex items-baseline gap-2'>
                <span className='font-mono text-sm font-medium text-foreground'>{name}</span>
                {version && (
                    <span className='text-xs text-muted-foreground'>{version}</span>
                )}
            </div>
            {description && (
                <p className='mt-0.5 text-xs text-muted-foreground line-clamp-2'>{description}</p>
            )}
        </div>
        <div className='flex shrink-0 items-center gap-1'>
            {actions}
        </div>
    </div>
);

const IconBtn = ({ icon: Icon, onClick, title, className }) => (
    <button
        title={title}
        onClick={onClick}
        className={cn(
            'rounded p-1.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-surface-raised',
            className,
        )}
    >
        <Icon className='size-3.5' />
    </button>
);

const FavoriteStar = ({ isFav, onToggle, addTitle, removeTitle }) => (
    <button
        title={isFav ? removeTitle : addTitle}
        onClick={onToggle}
        className='group/fav rounded p-1.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-surface-raised'
    >
        {isFav ? (
            <>
                <Star className='size-3.5 fill-favorite text-favorite group-hover/fav:hidden' />
                <StarOff className='size-3.5 hidden group-hover/fav:block' />
            </>
        ) : (
            <Star className='size-3.5' />
        )}
    </button>
);

const SectionLabel = ({ children, className }) => (
    <div className={cn('px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-surface', className)}>
        {children}
    </div>
);

const EmptyHint = ({ children }) => (
    <p className='px-4 py-3 text-xs text-muted-foreground'>{children}</p>
);

export const PackagesDrawer = ({ binId, packages, onPackagesChange }) => {
    const { t } = useTranslation();
    const { packagesOpen, setPackagesOpen } = usePackagesPanel();
    const isMobile = useIsMobile();
    const [query, setQuery] = useState('');
    const { results, isSearching } = useNpmSearch(query);
    const [favoritePackages] = useSettings('favoritePackages', []);

    const isInstalled = useCallback(name => packages.some(p => p.name === name), [packages]);
    const isFavorite = useCallback(name => favoritePackages.includes(name), [favoritePackages]);

    const install = useCallback(
        async (name, version) => {
            if (isInstalled(name)) return;
            const next = [...packages, { name, version: version ?? null }];
            onPackagesChange(next);
            await updateBin(binId, { packages: next });
        },
        [binId, packages, isInstalled, onPackagesChange],
    );

    const uninstall = useCallback(
        async name => {
            const next = packages.filter(p => p.name !== name);
            onPackagesChange(next);
            await updateBin(binId, { packages: next });
        },
        [binId, packages, onPackagesChange],
    );

    const toggleFavorite = useCallback(
        name => {
            const favs = settings.get('favoritePackages', []);
            const next = favs.includes(name) ? favs.filter(f => f !== name) : [...favs, name];
            settings.set('favoritePackages', next);
        },
        [],
    );

    const showResults = query.trim().length > 0;

    return (
        <Drawer open={packagesOpen} onOpenChange={setPackagesOpen} direction={isMobile ? 'bottom' : 'right'}>
            <DrawerContent className={cn('p-0 flex flex-col', isMobile ? 'h-[calc(100dvh-2.5rem)] rounded-none' : 'w-[22rem] sm:w-[26rem]')}>
                <DrawerHeader className='border-b border-border px-4 py-3 shrink-0'>
                    <DrawerTitle className='text-sm font-medium'>
                        {t('packages.title')}
                    </DrawerTitle>
                </DrawerHeader>

                <div className='flex items-center gap-2 border-b border-border px-3 py-2 shrink-0'>
                    {isSearching ? (
                        <Loader className='size-3.5 shrink-0 text-muted-foreground animate-spin' />
                    ) : (
                        <Search className='size-3.5 shrink-0 text-muted-foreground' />
                    )}
                    <input
                        type='text'
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('packages.search_placeholder')}
                        className='flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none'
                        autoFocus
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className='text-muted-foreground hover:text-foreground'>
                            <X className='size-3.5' />
                        </button>
                    )}
                </div>

                <div className='min-h-0 flex-1 overflow-y-auto'>
                    {showResults && (
                        <>
                            {results.length === 0 && !isSearching && (
                                <EmptyHint>{t('packages.no_results')}</EmptyHint>
                            )}
                            {results.map(pkg => (
                                <PackageRow
                                    key={pkg.name}
                                    name={pkg.name}
                                    description={pkg.description}
                                    version={pkg.version}
                                    actions={
                                        <>
                                            <FavoriteStar
                                                isFav={isFavorite(pkg.name)}
                                                onToggle={() => toggleFavorite(pkg.name)}
                                                addTitle={t('packages.favorite')}
                                                removeTitle={t('packages.unfavorite')}
                                            />
                                            <IconBtn
                                                icon={isInstalled(pkg.name) ? Trash2 : Plus}
                                                title={isInstalled(pkg.name) ? t('packages.uninstall') : t('packages.install')}
                                                onClick={() =>
                                                    isInstalled(pkg.name)
                                                        ? uninstall(pkg.name)
                                                        : install(pkg.name, pkg.version)
                                                }
                                                className={isInstalled(pkg.name) ? 'text-destructive hover:text-destructive' : 'hover:text-brand'}
                                            />
                                        </>
                                    }
                                />
                            ))}
                        </>
                    )}

                    {!showResults && (
                        <>
                            <SectionLabel>{t('packages.installed')}</SectionLabel>
                            {packages.length === 0 ? (
                                <EmptyHint>{t('packages.none_installed')}</EmptyHint>
                            ) : (
                                packages.map(pkg => (
                                    <PackageRow
                                        key={pkg.name}
                                        name={pkg.name}
                                        version={pkg.version}
                                        actions={
                                            <>
                                                <FavoriteStar
                                                    isFav={isFavorite(pkg.name)}
                                                    onToggle={() => toggleFavorite(pkg.name)}
                                                    addTitle={t('packages.favorite')}
                                                    removeTitle={t('packages.unfavorite')}
                                                />
                                                <IconBtn
                                                    icon={Trash2}
                                                    title={t('packages.uninstall')}
                                                    onClick={() => uninstall(pkg.name)}
                                                    className='hover:text-destructive'
                                                />
                                            </>
                                        }
                                    />
                                ))
                            )}

                            {favoritePackages.length > 0 && (
                                <>
                                    <div className='flex items-center border-b border-border bg-surface'>
                                        <SectionLabel className='flex-1 border-0'>{t('packages.favorites')}</SectionLabel>
                                        <button
                                            onClick={() => settings.set('favoritePackages', [])}
                                            className='px-3 text-xs text-muted-foreground hover:text-foreground transition-colors'
                                        >
                                            {t('packages.clear_favorites')}
                                        </button>
                                    </div>
                                    {favoritePackages.map(name => (
                                        <PackageRow
                                            key={name}
                                            name={name}
                                            actions={
                                                <>
                                                    <FavoriteStar
                                                        isFav
                                                        onToggle={() => toggleFavorite(name)}
                                                        addTitle={t('packages.favorite')}
                                                        removeTitle={t('packages.unfavorite')}
                                                    />
                                                    <IconBtn
                                                        icon={isInstalled(name) ? Trash2 : Plus}
                                                        title={isInstalled(name) ? t('packages.uninstall') : t('packages.install')}
                                                        onClick={() =>
                                                            isInstalled(name)
                                                                ? uninstall(name)
                                                                : install(name, null)
                                                        }
                                                        className={isInstalled(name) ? 'text-destructive hover:text-destructive' : 'hover:text-brand'}
                                                    />
                                                </>
                                            }
                                        />
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
