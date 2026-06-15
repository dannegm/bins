import { useTranslation } from 'react-i18next';
import { useSettings } from '@/hooks/use-settings';
import { Switch } from '@/ui/switch';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const SelectField = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>
                {opt.label}
            </option>
        ))}
    </select>
);

const NumberSelect = ({ value, onChange, options }) => (
    <SelectField
        value={value}
        onChange={v => onChange(Number(v))}
        options={options.map(n => ({ value: String(n), label: String(n) }))}
    />
);

export const PrettierSection = () => {
    const { t } = useTranslation();
    const [prettier, setPrettier] = useSettings('prettier', {});

    const set = (key, val) => setPrettier(prev => ({ ...prev, [key]: val }));

    const TRAILING_COMMA_OPTIONS = [
        { value: 'all', label: 'all' },
        { value: 'es5', label: 'es5' },
        { value: 'none', label: 'none' },
    ];

    const ARROW_PARENS_OPTIONS = [
        { value: 'avoid', label: 'avoid' },
        { value: 'always', label: 'always' },
    ];

    return (
        <section id='settings-prettier'>
            <SectionHeading title={t('settings.prettier.title')} />
            <SettingGroup>
                <SettingRow label={t('settings.prettier.print_width_label')}>
                    <NumberSelect
                        value={prettier.printWidth ?? 100}
                        onChange={v => set('printWidth', v)}
                        options={[60, 80, 100, 120, 140]}
                    />
                </SettingRow>
                <SettingRow label={t('settings.prettier.tab_width_label')}>
                    <NumberSelect
                        value={prettier.tabWidth ?? 4}
                        onChange={v => set('tabWidth', v)}
                        options={[2, 4, 8]}
                    />
                </SettingRow>
                <SettingRow label={t('settings.prettier.use_tabs_label')}>
                    <Switch
                        checked={prettier.useTabs ?? false}
                        onCheckedChange={v => set('useTabs', v)}
                    />
                </SettingRow>
                <SettingRow label={t('settings.prettier.semi_label')}>
                    <Switch checked={prettier.semi ?? true} onCheckedChange={v => set('semi', v)} />
                </SettingRow>
                <SettingRow label={t('settings.prettier.single_quote_label')}>
                    <Switch
                        checked={prettier.singleQuote ?? true}
                        onCheckedChange={v => set('singleQuote', v)}
                    />
                </SettingRow>
                <SettingRow label={t('settings.prettier.trailing_comma_label')}>
                    <SelectField
                        value={prettier.trailingComma ?? 'all'}
                        onChange={v => set('trailingComma', v)}
                        options={TRAILING_COMMA_OPTIONS}
                    />
                </SettingRow>
                <SettingRow label={t('settings.prettier.bracket_spacing_label')}>
                    <Switch
                        checked={prettier.bracketSpacing ?? true}
                        onCheckedChange={v => set('bracketSpacing', v)}
                    />
                </SettingRow>
                <SettingRow label={t('settings.prettier.arrow_parens_label')}>
                    <SelectField
                        value={prettier.arrowParens ?? 'avoid'}
                        onChange={v => set('arrowParens', v)}
                        options={ARROW_PARENS_OPTIONS}
                    />
                </SettingRow>
                <SettingRow label={t('settings.prettier.jsx_single_quote_label')}>
                    <Switch
                        checked={prettier.jsxSingleQuote ?? true}
                        onCheckedChange={v => set('jsxSingleQuote', v)}
                    />
                </SettingRow>
            </SettingGroup>
        </section>
    );
};
