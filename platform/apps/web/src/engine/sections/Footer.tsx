/* eslint-disable @next/next/no-img-element -- Decorative template asset. */
import type {SectionProps} from '../types';
export default function Footer({ornamentUrl}: SectionProps<'footer'>) {
  return <footer className="footer-section"><img src={ornamentUrl} alt="" aria-hidden="true" /></footer>;
}
