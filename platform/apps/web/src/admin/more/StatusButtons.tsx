'use client';

import {useTranslations} from 'next-intl';
import {setTemplateStatusAction} from './actions';
import {ActionButton} from './ActionForm';

const NEXT: Record<string, ('draft' | 'live' | 'retired')[]> = {draft: ['live', 'retired'], live: ['retired', 'draft'], retired: ['draft']};

export function StatusButtons({id, status}: {id: string; status: string}) {
  const t = useTranslations('adminMore.templates');
  return (
    <div className="am-inline">
      {(NEXT[status] ?? []).map((target) => (
        <ActionButton key={target} run={() => setTemplateStatusAction(id, target)} label={t(`moveTo.${target}`)} tone={target === 'live' ? 'primary' : 'secondary'} testId={`status-${target}`} />
      ))}
    </div>
  );
}
