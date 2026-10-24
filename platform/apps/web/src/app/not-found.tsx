import Link from 'next/link';

// Root fallback for paths outside any locale (locale pages use app/[locale]/not-found.tsx).
export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body style={{fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minBlockSize: '100vh', margin: 0, background: '#fbf6ee', color: '#2a2118', textAlign: 'center', padding: '1.5rem'}}>
        <div>
          <h1 style={{fontSize: '1.5rem'}}>الصفحة غير موجودة · Page not found</h1>
          <p><Link href="/ar" style={{color: '#0b3b2e'}}>العودة للرئيسية</Link> · <Link href="/en" style={{color: '#0b3b2e'}}>Back home</Link></p>
        </div>
      </body>
    </html>
  );
}
