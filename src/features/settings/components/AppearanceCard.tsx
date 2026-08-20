import {
  useLayoutContext,
  type LayoutThemeType,
} from '@/context/useLayoutContext';
import { cn } from '@/lib/utils';
import type { IconType } from 'react-icons/lib';
import { LuMonitor, LuMoon, LuPalette, LuSun } from 'react-icons/lu';
import { SettingsCard } from './SettingsCard';

const THEME_OPTIONS: { value: LayoutThemeType; label: string; icon: IconType }[] = [
  { value: 'light', label: 'Light', icon: LuSun },
  { value: 'dark', label: 'Dark', icon: LuMoon },
  { value: 'system', label: 'System', icon: LuMonitor },
];

export function AppearanceCard() {
  const { theme, updateSettings } = useLayoutContext();

  return (
    <SettingsCard
      icon={LuPalette}
      title="Appearance"
      description="Theme and navigation preferences for this device."
    >
      <div className="space-y-5">
        <div>
          <span className="form-label mb-2 block text-sm font-medium text-default-700">Theme</span>
          <div className="flex flex-wrap items-center gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={cn(
                  'btn btn-sm',
                  theme === value
                    ? 'bg-primary text-white'
                    : 'border border-default-200 bg-transparent text-default-600 hover:bg-default-150'
                )}
                onClick={() => updateSettings({ theme: value })}
              >
                <Icon className="size-4 me-1" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Sidebar style" hint="How the navigation collapses on desktop.">
            <span className="relative flex items-center">
              <LuPanelLeft className="pointer-events-none absolute start-3 size-4 text-default-500" />
              <Select
                className="ps-9"
                value={sidenav.size}
                onChange={event =>
                  updateSettings({
                    sidenav: { ...sidenav, size: event.target.value as SideNavSizeType },
                  })
                }
              >
                {SIDENAV_SIZE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </span>
          </Field>
          <Field label="Sidebar color">
            <Select
              value={sidenav.color}
              onChange={event =>
                updateSettings({
                  sidenav: { ...sidenav, color: event.target.value as SideNavColorType },
                })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
        </div> */}
      </div>
    </SettingsCard>
  );
}
