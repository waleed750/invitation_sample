import localFont from 'next/font/local';

// Loaded only by the landing/gallery pages. Cormorant Garamond and Inter come from the root layout.
const amiri = localFont({
  src: [
    { path: '../../fonts/amiri/amiri-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/amiri/amiri-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/amiri/amiri-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/amiri/amiri-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-amiri', display: 'swap', adjustFontFallback: false
});
const plex = localFont({
  src: [
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-600-normal.woff2', weight: '600', style: 'normal' }
  ],
  variable: '--font-plex-ar', display: 'swap', adjustFontFallback: false
});
const ruqaa = localFont({
  src: [
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-ruqaa', display: 'swap', adjustFontFallback: false
});

export const homeFontClassName = [amiri.variable, plex.variable, ruqaa.variable].join(' ');
