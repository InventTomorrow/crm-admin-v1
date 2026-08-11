import type { ReactNode } from 'react';
import type { IconType } from 'react-icons/lib';

interface SettingsCardProps {
  icon: IconType;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Section card used by every settings tab. */
export function SettingsCard({ icon: Icon, title, description, children }: SettingsCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h6 className="card-title flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {title}
        </h6>
        {description && <p className="mt-1 text-sm text-default-500">{description}</p>}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
