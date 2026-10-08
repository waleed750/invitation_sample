import '@/styles/commerce.css';
import {homeFontClassName} from '@/components/home/fonts';

export default function CheckoutLayout({children}: {children: React.ReactNode}) {
  return <div className={`commerce-shell ${homeFontClassName}`}>{children}</div>;
}
