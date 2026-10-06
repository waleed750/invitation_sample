// SVG chevron pointing toward the reading direction; CSS mirrors it in RTL.
export function Chevron({className = ''}: {className?: string}) {
  return (
    <svg className={`hm-chev ${className}`} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}
