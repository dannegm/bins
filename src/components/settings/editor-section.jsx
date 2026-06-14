import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Switch } from '@/ui/switch';
import { Button } from '@/ui/button';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const NumberStepper = ({ value, onChange, min = 1, max = 100 }) => (
    <div className='flex items-center gap-1'>
        <Button
            variant='outline'
            size='icon-sm'
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
        >
            <Minus />
        </Button>
        <span className='w-8 text-center text-sm font-mono text-foreground'>{value}</span>
        <Button
            variant='outline'
            size='icon-sm'
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
        >
            <Plus />
        </Button>
    </div>
);

export const EditorSection = () => {
    const { t } = useTranslation();
    const [fontSize, setFontSize] = useSettings('fontSize', 14);
    const [tabSize, setTabSize] = useSettings('tabSize', 2);
    const [wordWrap, setWordWrap] = useSettings('wordWrap', false);
    const [lineNumbers, setLineNumbers] = useSettings('lineNumbers', true);
    const [minimap, setMinimap] = useSettings('minimap', false);

    return (
        <section id='settings-editor'>
            <SectionHeading title={t('settings.editor.title')} />
            <SettingGroup>
                <SettingRow label={t('settings.editor.font_size_label')}>
                    <NumberStepper value={fontSize} onChange={setFontSize} min={10} max={32} />
                </SettingRow>
                <SettingRow label={t('settings.editor.tab_size_label')}>
                    <NumberStepper value={tabSize} onChange={setTabSize} min={1} max={8} />
                </SettingRow>
                <SettingRow label={t('settings.editor.word_wrap_label')}>
                    <Switch checked={wordWrap} onCheckedChange={setWordWrap} />
                </SettingRow>
                <SettingRow label={t('settings.editor.line_numbers_label')}>
                    <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} />
                </SettingRow>
                <SettingRow label={t('settings.editor.minimap_label')}>
                    <Switch checked={minimap} onCheckedChange={setMinimap} />
                </SettingRow>
            </SettingGroup>
        </section>
    );
};
