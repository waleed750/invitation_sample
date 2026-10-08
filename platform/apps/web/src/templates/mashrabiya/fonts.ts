import localFont from 'next/font/local';

export const arefRuqaa = localFont({
  src: [
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-aref-ruqaa', display: 'swap', adjustFontFallback: false
});

export const fraunces = localFont({
  src: [
    { path: '../../fonts/fraunces/fraunces-latin-normal.woff2', weight: '100 900', style: 'normal' },
    { path: '../../fonts/fraunces/fraunces-latin-italic.woff2', weight: '100 900', style: 'italic' }
  ],
  variable: '--font-fraunces', display: 'swap', adjustFontFallback: false
});

export const ibmPlexSansArabic = localFont({
  src: [
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans-arabic/ibm-plex-sans-arabic-arabic-600-normal.woff2', weight: '600', style: 'normal' }
  ],
  variable: '--font-ibm-plex-sans-arabic', display: 'swap', adjustFontFallback: false
});

export const ibmPlexSans = localFont({
  src: [
    { path: '../../fonts/ibm-plex-sans/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/ibm-plex-sans/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' }
  ],
  variable: '--font-ibm-plex-sans', display: 'swap', adjustFontFallback: false
});

export const fontClassName = `${arefRuqaa.variable} ${fraunces.variable} ${ibmPlexSansArabic.variable} ${ibmPlexSans.variable}`;
