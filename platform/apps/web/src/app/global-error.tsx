'use client';

// Last-resort page when even the locale layout fails. Bilingual, no details, no external assets.
export default function GlobalError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minBlockSize: '100vh', margin: 0, background: '#fbf6ee', color: '#2a2118', textAlign: 'center', padding: '1.5rem'}}>
        <div>
          <h1 style={{fontSize: '1.5rem'}}>حدث خطأ غير متوقع · Something went wrong</h1>
          <p>نعتذر عن ذلك. حاولوا مرة أخرى بعد قليل. · Please try again shortly.</p>
          <button type="button" onClick={reset} style={{padding: '.6rem 1.2rem', borderRadius: 8, border: 0, background: '#0b3b2e', color: '#fff', cursor: 'pointer'}}>إعادة المحاولة · Retry</button>
        </div>
      </body>
    </html>
  );
}
