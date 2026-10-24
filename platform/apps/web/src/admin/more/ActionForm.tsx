'use client';

import {useActionState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import type {ActionResult} from './call';

type Action = (previous: unknown, form: FormData) => Promise<ActionResult>;

interface Props {
  action: Action;
  submitLabel: string;
  children: React.ReactNode;
  testId?: string;
  /** Called after a success (e.g. to clear the form). */
  resetOnSuccess?: boolean;
  danger?: boolean;
}

/** A form wired to a server action: shows the API's error code in words, or a "saved" note. */
export function ActionForm({action, submitLabel, children, testId, resetOnSuccess = false, danger = false}: Props) {
  const t = useTranslations('adminMore');
  const router = useRouter();
  const [state, run, pending] = useActionState<ActionResult | null, FormData>(action, null);
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form
      action={run}
      className="am-form"
      data-testid={testId}
      ref={(form) => {
        if (form && resetOnSuccess && state?.ok) form.reset();
      }}
    >
      {children}
      <div className="am-form__row">
        <button type="submit" className={danger ? 'dashboard-btn-secondary am-danger' : 'dashboard-btn-primary'} disabled={pending}>{submitLabel}</button>
        {state?.ok && <span className="am-ok" role="status">{t('saved')}</span>}
        {state && !state.ok && (
          <span className="am-error" role="alert" data-testid="am-error" data-code={state.error}>
            {t.has(`errors.${state.error}`) ? t(`errors.${state.error}`) : t('errors.unknown_error')}
          </span>
        )}
      </div>
    </form>
  );
}

/** A one-click button wired to a server action that returns a result. */
export function ActionButton({run, label, confirmText, testId, tone = 'secondary'}: {run: () => Promise<ActionResult>; label: string; confirmText?: string; testId?: string; tone?: 'primary' | 'secondary'}) {
  const t = useTranslations('adminMore');
  const router = useRouter();
  const [state, trigger, pending] = useActionState<ActionResult | null, void>(async () => {
    if (confirmText !== undefined && !window.confirm(confirmText)) return null;
    const result = await run();
    if (result.ok) router.refresh();
    return result;
  }, null);
  return (
    <span className="am-inline">
      <button type="button" className={tone === 'primary' ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'} disabled={pending} onClick={() => trigger()} data-testid={testId}>{label}</button>
      {state && !state.ok && (
        <span className="am-error" role="alert" data-code={state.error}>{t.has(`errors.${state.error}`) ? t(`errors.${state.error}`) : t('errors.unknown_error')}</span>
      )}
    </span>
  );
}
