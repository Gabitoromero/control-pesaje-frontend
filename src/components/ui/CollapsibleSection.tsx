import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface CollapsibleSectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Reusable collapsible section with a header toggle, count badge, and CSS
 * max-height transition. Starts collapsed by default. When `forceOpen`
 * transitions from false -> true the section auto-expands (error visibility
 * takes priority); the user can collapse it again afterwards.
 */
export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  forceOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const prevForceOpen = useRef(forceOpen);

  // forceOpen false -> true expands the section (one-way transition).
  // A true -> false transition is ignored so the section never fights the user.
  useEffect(() => {
    if (!prevForceOpen.current && forceOpen) {
      setIsOpen(true);
    }
    prevForceOpen.current = forceOpen;
  }, [forceOpen]);

  // Measure actual content height for a precise max-height transition.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : '0px';
  }, [isOpen, children]);

  return (
    <div className="bg-white rounded-lg shadow">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown data-testid="chevron-down" size={20} className="text-gray-500" />
          ) : (
            <ChevronRight data-testid="chevron-right" size={20} className="text-gray-500" />
          )}
          <h2 className="text-lg font-medium text-gray-800">{title}</h2>
        </span>
        <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {count}
        </span>
      </button>

      <div
        id={panelId}
        ref={panelRef}
        role="region"
        aria-label={title}
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: '0px' }}
      >
        <div
          className="px-6 pb-6"
          style={{ visibility: isOpen ? 'visible' : 'hidden' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
