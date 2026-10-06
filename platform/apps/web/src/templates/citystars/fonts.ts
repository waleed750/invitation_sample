import { Tajawal, Amiri, Aref_Ruqaa } from 'next/font/google';

const tajawal = Tajawal({
  subsets: ['latin', 'arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
});

const amiri = Amiri({
  subsets: ['latin', 'arabic'],
  weight: ['400', '700'],
  variable: '--font-serif',
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ['latin', 'arabic'],
  weight: ['400'],
  variable: '--font-script',
});

export const fontClassName = `${tajawal.variable} ${amiri.variable} ${arefRuqaa.variable}`;
