import {Aref_Ruqaa, Fraunces, IBM_Plex_Sans, IBM_Plex_Sans_Arabic} from 'next/font/google';

export const arefRuqaa = Aref_Ruqaa({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-aref-ruqaa',
  display: 'swap',
});

export const fraunces = Fraunces({
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['400', '600'],
  subsets: ['arabic', 'latin'],
  variable: '--font-ibm-plex-sans-arabic',
  display: 'swap',
});

export const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export const fontClassName = `${arefRuqaa.variable} ${fraunces.variable} ${ibmPlexSansArabic.variable} ${ibmPlexSans.variable}`;
