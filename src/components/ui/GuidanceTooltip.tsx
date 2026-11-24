import { ExternalLink, Info, Sparkles, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export interface GuidanceTooltipProps {
  title: string;
  items: string[];
  summary?: string;
  guideLink?: string;
  guideText?: string;
  buttonLabel?: string;
  align?: 'left' | 'right' | 'center';
}

interface PopoverPosition {
  top: number;
  left: number;
  maxHeight?: number;
}

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 6;

export const GuidanceTooltip: React.FC<GuidanceTooltipProps> = ({
  title,
  items,
  summary,
  guideLink = '/guide',
  guideText = 'Scientific guide',
  buttonLabel,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Fixed positioning keeps the popover out of the document's scrollable area,
  // so hovering it never reveals a new page scrollbar. Flip above the trigger
  // when there isn't enough room below, and clamp it inside the viewport.
  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = containerRef.current?.getBoundingClientRect();
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const popoverWidth = popover.offsetWidth;
      const popoverHeight = popover.scrollHeight;
      const spaceAbove = trigger.top;
      const spaceBelow = window.innerHeight - trigger.bottom;
      const fitsBelow = spaceBelow >= popoverHeight + TRIGGER_GAP + VIEWPORT_MARGIN;
      const fitsAbove = spaceAbove >= popoverHeight + TRIGGER_GAP + VIEWPORT_MARGIN;

      let top: number;
      let maxHeight: number | undefined;

      if (fitsBelow) {
        top = trigger.bottom + TRIGGER_GAP;
      } else if (fitsAbove) {
        top = trigger.top - popoverHeight - TRIGGER_GAP;
      } else {
        const placeBelow = spaceBelow >= spaceAbove;
        maxHeight = Math.max(
          120,
          (placeBelow ? spaceBelow : spaceAbove) - TRIGGER_GAP - VIEWPORT_MARGIN,
        );
        top = placeBelow
          ? trigger.bottom + TRIGGER_GAP
          : Math.max(VIEWPORT_MARGIN, trigger.top - TRIGGER_GAP - maxHeight);
      }

      let left =
        align === 'left'
          ? trigger.left
          : align === 'center'
            ? trigger.left + (trigger.width - popoverWidth) / 2
            : trigger.right - popoverWidth;
      left = Math.min(
        Math.max(left, VIEWPORT_MARGIN),
        Math.max(VIEWPORT_MARGIN, window.innerWidth - popoverWidth - VIEWPORT_MARGIN),
      );
      top = Math.max(VIEWPORT_MARGIN, top);

      setPosition((prev) =>
        prev && prev.top === top && prev.left === left && prev.maxHeight === maxHeight
          ? prev
          : { top, left, maxHeight },
      );
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [align, isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`What to look for: ${title}`}
        className={
          buttonLabel
            ? 'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-sans font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer'
            : 'p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer'
        }
      >
        <Info className="w-3.5 h-3.5" />
        {buttonLabel && <span>{buttonLabel}</span>}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          style={{
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            maxHeight: position?.maxHeight,
            visibility: position ? 'visible' : 'hidden',
          }}
          className="fixed z-50 w-72 sm:w-80 max-w-[calc(100vw-1rem)] overflow-y-auto p-3.5 text-xs bg-white border border-slate-200/90 rounded-xl shadow-xl space-y-2.5 font-sans"
        >
          {/* Popover Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px] uppercase tracking-wide font-mono">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>What to look for</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              aria-label="Close guidance popover"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Context Title & Summary */}
          <div className="space-y-1">
            <div className="font-bold text-slate-900 text-xs font-heading">{title}</div>
            {summary && <p className="text-[11px] text-slate-500 leading-relaxed">{summary}</p>}
          </div>

          {/* Bulleted Specific Indicators */}
          <ul className="space-y-1.5 text-[11px] text-slate-700 leading-relaxed list-disc list-outside pl-3.5">
            {items.map((item, idx) => (
              <li key={idx} className="marker:text-blue-500">
                {item}
              </li>
            ))}
          </ul>

          {/* Actionable Link to Guide */}
          {guideLink && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400">Documentation</span>
              <Link
                to={guideLink}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span>{guideText}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
