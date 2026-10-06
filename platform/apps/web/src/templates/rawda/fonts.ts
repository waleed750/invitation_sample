import {Amiri, Aref_Ruqaa, Cormorant_Garamond, IBM_Plex_Sans_Arabic} from 'next/font/google';

export const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-amiri',
  display: 'swap',
});

export const arefRuqaa = Aref_Ruqaa({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-aref-ruqaa',
  display: 'swap',
});

export const cormorantGaramond = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
});

export const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['400', '500'],
  subsets: ['arabic', 'latin'],
  variable: '--font-ibm-plex-sans-arabic',
  display: 'swap',
});

export const fontClassName = `${amiri.variable} ${arefRuqaa.variable} ${cormorantGaramond.variable} ${ibmPlexSansArabic.variable}`;
