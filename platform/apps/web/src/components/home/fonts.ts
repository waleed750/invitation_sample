import {Amiri, Aref_Ruqaa, IBM_Plex_Sans_Arabic} from 'next/font/google';

// Loaded only by the landing/gallery pages. Cormorant Garamond and Inter come from the root layout.
const amiri = Amiri({subsets: ['arabic', 'latin'], weight: ['400', '700'], variable: '--font-amiri', display: 'swap'});
const plex = IBM_Plex_Sans_Arabic({subsets: ['arabic', 'latin'], weight: ['400', '500', '600'], variable: '--font-plex-ar', display: 'swap'});
const ruqaa = Aref_Ruqaa({subsets: ['arabic', 'latin'], weight: ['700'], variable: '--font-ruqaa', display: 'swap'});

export const homeFontClassName = [amiri.variable, plex.variable, ruqaa.variable].join(' ');
