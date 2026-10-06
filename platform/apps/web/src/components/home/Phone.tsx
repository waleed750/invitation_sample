import type {CSSProperties, ReactNode} from 'react';

export function Phone({children, className = '', style, label}: {children: ReactNode; className?: string; style?: CSSProperties; label?: string}) {
  return (
    <div className={`hm-phone ${className}`} style={style} role="img" aria-label={label}>
      <div className="hm-phone__screen">{children}</div>
    </div>
  );
}
