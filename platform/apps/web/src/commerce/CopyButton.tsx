'use client';

import {useState} from 'react';
import {IconCheck, IconCopy} from './icons';

export function CopyButton({
  value,
  label,
  copiedLabel,
  className = 'copy-btn',
  iconOnly = false,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  className?: string;
  iconOnly?: boolean;
}) {
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

  return (
    <button
      className={className}
      type="button"
      onClick={copy}
      aria-live="polite"
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
    </button>
  );
}
