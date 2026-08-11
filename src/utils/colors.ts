export function twColor(name: string) {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
}

/** Theme-reactive chart colors — call inside getOptions so theme flips re-resolve. */
export const colors = {
  primary: () => twColor('primary'),
  success: () => twColor('success'),
  danger: () => twColor('danger'),
  warning: () => twColor('warning'),
  info: () => twColor('info'),
  gray: () => twColor('gray-500'),
  /** Chart grid lines. */
  border: () => twColor('default-200'),
  /** Chart axis/legend text. */
  foreground: () => twColor('default-600'),
};
