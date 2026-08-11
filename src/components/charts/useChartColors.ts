import { useEffect, useState } from 'react';
import { twColor } from '@/utils/colors';

export interface ChartColors {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** Grid lines. */
  border: string;
  /** Axis/legend text. */
  foreground: string;
  mode: 'light' | 'dark';
}

const readChartColors = (): ChartColors => ({
  primary: twColor('primary'),
  success: twColor('success'),
  warning: twColor('warning'),
  danger: twColor('danger'),
  info: twColor('info'),
  border: twColor('default-200'),
  foreground: twColor('default-600'),
  mode: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
});

/**
 * Theme-reactive chart palette. Watches the html `data-theme` attribute (a
 * single-node, attribute-scoped observer) so Apex options recompute with the
 * fresh CSS variables after the customizer flips the theme.
 */
export function useChartColors(): ChartColors {
  const [chartColors, setChartColors] = useState(readChartColors);

  useEffect(() => {
    const observer = new MutationObserver(() => setChartColors(readChartColors()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return chartColors;
}
