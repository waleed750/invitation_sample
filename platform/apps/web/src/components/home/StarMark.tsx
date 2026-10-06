// Eight-point star (two squares rotated 45 degrees) inside a thin circle. Replaces the old text glyph.
export function StarMark({size = 28, className = '', ring = true}: {size?: number; className?: string; ring?: boolean}) {
  return (
    <svg className={`hm-star ${className}`} width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ring ? <circle cx="16" cy="16" r="14.6" /> : null}
      <rect x="9.5" y="9.5" width="13" height="13" />
      <rect x="9.5" y="9.5" width="13" height="13" transform="rotate(45 16 16)" />
    </svg>
  );
}
