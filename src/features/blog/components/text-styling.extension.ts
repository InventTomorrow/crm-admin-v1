import { Extension } from '@tiptap/core';

/**
 * Line height and text alignment as inline styles on block nodes. Both mirror
 * the server sanitizer's allowedStyles — anything else it writes gets stripped
 * on save, so these two are deliberately the only typographic attributes here.
 */

export const LINE_HEIGHT_OPTIONS = [
  { label: 'Tight', value: '1.35' },
  { label: 'Normal', value: '1.6' },
  { label: 'Relaxed', value: '1.8' },
  { label: 'Loose', value: '2' },
] as const;

/** Matches the editor's own default leading, so "no attribute" reads as Normal. */
export const DEFAULT_LINE_HEIGHT = '1.6';

const LINE_HEIGHT_TYPES = ['paragraph', 'heading', 'listItem'];
const TEXT_ALIGN_TYPES = ['paragraph', 'heading'];

export type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockLineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
    blockTextAlign: {
      setTextAlign: (alignment: TextAlignValue) => ReturnType;
      unsetTextAlign: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create({
  name: 'blockLineHeight',

  addGlobalAttributes() {
    return [
      {
        types: LINE_HEIGHT_TYPES,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes =>
              attributes['lineHeight']
                ? { style: `line-height: ${attributes['lineHeight'] as string}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        lineHeight =>
        ({ commands }) =>
          LINE_HEIGHT_TYPES.every(type => commands.updateAttributes(type, { lineHeight })),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          LINE_HEIGHT_TYPES.every(type => commands.resetAttributes(type, 'lineHeight')),
    };
  },
});

export const TextAlign = Extension.create({
  name: 'blockTextAlign',

  addGlobalAttributes() {
    return [
      {
        types: TEXT_ALIGN_TYPES,
        attributes: {
          textAlign: {
            default: null,
            parseHTML: element => element.style.textAlign || null,
            renderHTML: attributes =>
              attributes['textAlign']
                ? { style: `text-align: ${attributes['textAlign'] as string}` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        alignment =>
        ({ commands }) =>
          TEXT_ALIGN_TYPES.every(type => commands.updateAttributes(type, { textAlign: alignment })),
      unsetTextAlign:
        () =>
        ({ commands }) =>
          TEXT_ALIGN_TYPES.every(type => commands.resetAttributes(type, 'textAlign')),
    };
  },
});
