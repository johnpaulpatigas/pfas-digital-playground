import { ExternalLink, Info, Sparkles, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
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

export const GuidanceTooltip: React.FC<GuidanceTooltipProps> = ({
  title,
  items,
  summary,
  guideLink = '/guide',
  guideText = 'Read full scientific guide',
  buttonLabel,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const alignmentClass =
    align === 'left' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

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
          role="tooltip"
          className={`absolute top-full mt-1.5 z-50 w-72 sm:w-80 p-3.5 text-xs bg-white border border-slate-200/90 rounded-xl shadow-xl space-y-2.5 font-sans animate-in fade-in zoom-in-95 duration-100 ${alignmentClass}`}
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
