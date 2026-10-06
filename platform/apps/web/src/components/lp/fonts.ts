import {Aref_Ruqaa, IBM_Plex_Sans_Arabic, Instrument_Serif, Readex_Pro} from 'next/font/google';

// Loaded only by the landing page so other routes don't pay for them.
const readex = Readex_Pro({subsets: ['arabic', 'latin'], weight: ['600', '700'], variable: '--font-readex', display: 'swap'});
const plexArabic = IBM_Plex_Sans_Arabic({subsets: ['arabic', 'latin'], weight: ['400', '500', '700'], variable: '--font-plex-ar', display: 'swap'});
const ruqaa = Aref_Ruqaa({subsets: ['arabic', 'latin'], weight: ['700'], variable: '--font-ruqaa', display: 'swap'});
const instrument = Instrument_Serif({subsets: ['latin'], weight: '400', variable: '--font-instrument', display: 'swap'});

export const lpFontClassName = [readex.variable, plexArabic.variable, ruqaa.variable, instrument.variable].join(' ');
