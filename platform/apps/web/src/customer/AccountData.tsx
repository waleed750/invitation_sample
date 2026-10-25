'use client';

import {useState, useTransition} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {deleteAccountAction, updateNameAction} from './account-actions';

/** Name, data export and account deletion (real accounts only). */
export function AccountData({initialName, email}: {initialName: string; email: string}) {
  const t = useTranslations('customer.account');
  const locale = useLocale();
  const [name, setName] = useState(initialName);
  const [nameState, setNameState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [confirm, setConfirm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function saveName(event: React.FormEvent) {
    event.preventDefault();
    setNameState('idle');
    start(async () => {
      const result = await updateNameAction({name});
      setNameState(result.ok ? 'saved' : 'error');
    });
  }

  function remove(event: React.FormEvent) {
    event.preventDefault();
    setDeleteError(null);
    start(async () => {
      const result = await deleteAccountAction({confirmEmail: confirm});
      if (result.ok) {
        window.location.assign(`/${locale}?account=deleted`);
        return;
      }
      setDeleteError(result.error);
    });
  }

  const matches = confirm.trim().toLowerCase() === email.trim().toLowerCase() && email !== '';

  return (
    <>
      <section className="data-card" aria-labelledby="acc-name">
        <h2 id="acc-name">{t('nameTitle')}</h2>
        <form onSubmit={saveName} className="data-card">
          <label htmlFor="acc-name-input">{t('nameLabel')}</label>
          <input id="acc-name-input" name="name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} data-testid="account-name" />
          <button type="submit" className="btn-primary" disabled={pending || name.trim() === ''}>{t('save')}</button>
          {nameState === 'saved' && <p className="customer-ok" role="status">{t('saved')}</p>}
          {nameState === 'error' && <p className="customer-error" role="alert">{t('errors.failed')}</p>}
        </form>
      </section>

      <section className="data-card" aria-labelledby="acc-export">
        <h2 id="acc-export">{t('exportTitle')}</h2>
        <p>{t('exportBody')}</p>
        <a className="btn-secondary" href={`/${locale}/app/account/export`} download="my-data.json" data-testid="export-data">{t('exportButton')}</a>
      </section>

      <section className="data-card data-card--danger" aria-labelledby="acc-delete">
        <h2 id="acc-delete">{t('deleteTitle')}</h2>
        <p>{t('deleteBody')}</p>
        <form onSubmit={remove} className="data-card">
          <label htmlFor="acc-delete-input">{t('deleteLabel', {email})}</label>
          <input id="acc-delete-input" name="confirm" type="email" autoComplete="off" dir="ltr" value={confirm} onChange={(event) => setConfirm(event.target.value)} data-testid="delete-confirm" />
          <button type="submit" className="btn-danger" disabled={pending || !matches} data-testid="delete-account">{t('deleteButton')}</button>
          {deleteError && <p className="customer-error" role="alert" data-testid="delete-error">{t(`errors.${deleteError === 'confirmation_mismatch' || deleteError === 'admin_account' ? deleteError : 'failed'}`)}</p>}
        </form>
      </section>
    </>
  );
}
