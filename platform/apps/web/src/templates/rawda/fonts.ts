import localFont from 'next/font/local';

export const amiri = localFont({
  src: [
    { path: '../../fonts/amiri/amiri-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/amiri/amiri-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/amiri/amiri-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/amiri/amiri-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-amiri', display: 'swap', adjustFontFallback: false
});

export const arefRuqaa = localFont({
  src: [
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/aref-ruqaa/aref-ruqaa-arabic-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-aref-ruqaa', display: 'swap', adjustFontFallback: false
});

export const cormorantGaramond = localFont({
  src: [
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-500-italic.woff2', weight: '500', style: 'italic' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../fonts/cormorant-garamond/cormorant-garamond-latin-700-italic.woff2', weight: '700', style: 'italic' }
  ],
  variable: '--font-cormorant-garamond', display: 'swap', adjustFontFallback: false
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

export const fontClassName = `${amiri.variable} ${arefRuqaa.variable} ${cormorantGaramond.variable} ${ibmPlexSansArabic.variable}`;
