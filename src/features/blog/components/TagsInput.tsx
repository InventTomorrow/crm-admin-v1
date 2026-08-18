import { Input } from '@/components/ui/input';
import { useState, type KeyboardEvent } from 'react';
import { LuX } from 'react-icons/lu';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  invalid?: boolean;
  /** Tags already used elsewhere, offered as one-click suggestions. */
  suggestions?: string[];
}

/** Tags drive the related-posts logic, so they are lowercased and de-duplicated here too. */
export function TagsInput({ value, onChange, invalid, suggestions = [] }: TagsInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || value.includes(tag)) return setDraft('');
    onChange([...value, tag]);
    setDraft('');
  };

  const removeTag = (tag: string) => onChange(value.filter(existing => existing !== tag));

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(draft);
      return;
    }
    if (event.key === 'Backspace' && !draft && value.length) {
      removeTag(value[value.length - 1]!);
    }
  };

  const unusedSuggestions = suggestions.filter(tag => !value.includes(tag)).slice(0, 8);

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 ps-2.5 pe-1 text-xs font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <LuX className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input
        value={draft}
        invalid={invalid}
        placeholder="Type a tag and press Enter"
        onChange={event => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
      />

      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unusedSuggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="rounded-full border border-dashed border-default-300 px-2.5 py-1 text-xs text-default-500 hover:border-primary hover:text-primary"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
