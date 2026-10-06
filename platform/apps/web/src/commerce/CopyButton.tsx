'use client';

import {useState} from 'react';

export function CopyButton({value, label, copiedLabel}: {value: string; label: string; copiedLabel: string}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }
  return <button className="small-button" type="button" onClick={copy} aria-live="polite">{copied ? copiedLabel : label}</button>;
}
