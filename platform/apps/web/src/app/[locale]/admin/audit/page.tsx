import React from 'react';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {AdminApi} from '@/admin/api';
import {formatDate} from '@/lib/format';
import {Link} from '@/i18n/navigation';

export default async function AdminAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{action?: string; before?: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.audit');

  const {action, before} = await searchParams;

  const api = new AdminApi();
  const limit = 50;
  const logs = await api.getAuditLogs({
    limit,
    action: action || undefined,
    before: before || undefined,
  });

  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const nextCursor = lastLog ? `${lastLog.createdAt},${lastLog.id}` : null;

  return (
    <div style={{padding: '1.5rem', maxWidth: '1100px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0}}>
          {t('title')}
        </h1>

        {/* Action Filter */}
        <form method="GET" style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
          <input
            type="text"
            name="action"
            defaultValue={action || ''}
            placeholder={t('filterAction')}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          />
          <button type="submit" className="dashboard-btn-primary" style={{fontSize: '0.875rem'}}>
            {t('filter')}
          </button>
          {action && (
            <Link href="/admin/audit" className="dashboard-btn-secondary" style={{fontSize: '0.875rem', textDecoration: 'none'}}>
              {t('clearFilter')}
            </Link>
          )}
        </form>
      </div>

      {logs.length === 0 ? (
        <p style={{color: 'var(--color-muted)'}}>{t('noData')}</p>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflowX: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'start', fontSize: '0.875rem'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-alt)'}}>
                <th style={{padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'start'}}>{t('date')}</th>
                <th style={{padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'start'}}>{t('action')}</th>
                <th style={{padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'start'}}>{t('actor')}</th>
                <th style={{padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'start'}}>{t('target')}</th>
                <th style={{padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'start'}}>{t('details')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{borderBottom: '1px solid var(--color-border)'}}>
                  <td style={{padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--color-muted)'}}>
                    {formatDate(log.createdAt, locale as 'ar' | 'en')}
                  </td>
                  <td style={{padding: '0.75rem 1rem', fontWeight: 600}}>
                    <code style={{padding: '0.2rem 0.4rem', backgroundColor: 'var(--color-surface-alt)', borderRadius: '4px'}}>
                      {log.action}
                    </code>
                  </td>
                  <td style={{padding: '0.75rem 1rem'}}>
                    {log.actorEmail || (log.actorId ? <span title={log.actorId}>{log.actorId.slice(0, 8)}…</span> : t('system'))}
                  </td>
                  <td style={{padding: '0.75rem 1rem'}}>
                    {log.targetType || '-'}: {log.targetId ? <span title={log.targetId}>{log.targetId.slice(0, 8)}…</span> : '-'}
                  </td>
                  <td style={{padding: '0.75rem 1rem', maxWidth: '300px'}}>
                    <pre style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      maxHeight: '80px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--color-surface-alt)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Keyset Pagination Controls */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem'}}>
        {before ? (
          <Link
            href={`/admin/audit${action ? `?action=${encodeURIComponent(action)}` : ''}`}
            className="dashboard-btn-secondary"
            style={{textDecoration: 'none', fontSize: '0.875rem'}}
          >
            {t('latest')}
          </Link>
        ) : (
          <div />
        )}

        {logs.length === limit && nextCursor && (
          <Link
            href={`/admin/audit?before=${encodeURIComponent(nextCursor)}${action ? `&action=${encodeURIComponent(action)}` : ''}`}
            className="dashboard-btn-secondary"
            style={{textDecoration: 'none', fontSize: '0.875rem'}}
          >
            {t('older')}
          </Link>
        )}
      </div>
    </div>
  );
}
