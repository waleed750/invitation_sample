import '@/styles/commerce.css';

export default function CheckoutLayout({children}: {children: React.ReactNode}) {
  return <div className="commerce-shell">{children}</div>;
}

