'use client';

import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

const WIDTHS = [390, 768, 1280] as const;

/** The template's live design at the three widths a guest might use. */
export function TemplatePreview({slug}: {slug: string}) {
  const t = useTranslations('adminMore.templates');
  const locale = useLocale();
  const [width, setWidth] = useState<(typeof WIDTHS)[number]>(390);
  return (
    <div className="am-card">
      <div className="am-previews" role="group" aria-label={t('previewWidths')}>
        {WIDTHS.map((value) => (
          <button key={value} type="button" className="dashboard-btn-secondary" aria-pressed={width === value} data-testid={`preview-${value}`} onClick={() => setWidth(value)}>{value}</button>
        ))}
      </div>
      <div style={{overflowX: 'auto'}}>
        <iframe className="am-preview-frame" title={t('preview')} src={`/${locale}/preview/${slug}`} style={{inlineSize: `${width}px`, maxInlineSize: 'none'}} data-testid="template-preview-frame" data-width={width} />
      </div>
    </div>
  );
}
