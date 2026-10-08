import localFont from 'next/font/local';

const tajawal = localFont({
  src: [
    { path: '../../fonts/tajawal/tajawal-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/tajawal/tajawal-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/tajawal/tajawal-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/tajawal/tajawal-arabic-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/tajawal/tajawal-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/tajawal/tajawal-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-sans', display: 'swap', adjustFontFallback: false
});

const amiri = localFont({
  src: [
    { path: '../../fonts/amiri/amiri-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/amiri/amiri-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/amiri/amiri-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/amiri/amiri-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-serif', display: 'swap', adjustFontFallback: false
});

const arefRuqaa = localFont({
  src: [
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-script', display: 'swap', adjustFontFallback: false
});

export const fontClassName = `${tajawal.variable} ${amiri.variable} ${arefRuqaa.variable}`;
