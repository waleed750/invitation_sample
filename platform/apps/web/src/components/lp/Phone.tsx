import type {CSSProperties, ReactNode} from 'react';

// Shared device frame; beats put their own screen content inside.
export function Phone({children, className = '', style, label}: {children: ReactNode; className?: string; style?: CSSProperties; label?: string}) {
  return (
    <div className={`lp-phone ${className}`} style={style} role="img" aria-label={label}>
      <div className="lp-phone__screen">{children}</div>
    </div>
  );
}
