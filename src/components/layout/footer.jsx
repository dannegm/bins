import { useTranslation } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className='flex items-center gap-2 border-t border-border px-8 py-4 mb-1 text-xs text-muted-foreground'>
            <span className="inline sm:hidden">BINS.</span>
            <span className="hidden sm:inline">{t('footer.tagline')}</span>

            <span className='flex-grow' />

            <span>{`v${__APP_VERSION__}`}</span>
            <span> &mdash;</span>
            <a
                href={`https://github.com/dannegm/bins/commit/${__COMMIT_HASH__}`}
                target='_blank'
                rel='noreferrer'
                className='transition-colors hover:text-foreground'
            >
                {__COMMIT_HASH_SHORT__}
            </a>
        </footer>
    );
};
