'use client';

import {useTranslations} from 'next-intl';
import {deleteAssetAction, updateAssetAction} from './actions';
import {ActionButton, ActionForm} from './ActionForm';

export interface AssetRowData {
  id: string; r2_key: string; kind: string | null; source: string | null; license: string | null; license_url: string | null;
}

export function AssetRow({templateId, asset}: {templateId: string; asset: AssetRowData}) {
  const t = useTranslations('adminMore.templates');
  const missing = !(asset.source?.trim()) || !(asset.license?.trim());
  return (
    <div className="am-card" data-testid="asset-row" data-missing={missing}>
      <div className="am-inline">
        <strong className="am-mono" dir="ltr">{asset.r2_key}</strong>
        {asset.kind && <span className="am-badge">{asset.kind}</span>}
        {missing && <span className="am-badge am-badge--warn">{t('assetIncomplete')}</span>}
      </div>
      <ActionForm action={updateAssetAction} submitLabel={t('saveAsset')} testId="form-asset">
        <input type="hidden" name="templateId" value={templateId} />
        <input type="hidden" name="assetId" value={asset.id} />
        <div className="am-grid">
          <label>{t('source')}<input name="source" defaultValue={asset.source ?? ''} maxLength={500} /></label>
          <label>{t('license')}<input name="license" defaultValue={asset.license ?? ''} maxLength={200} /></label>
          <label>{t('licenseUrl')}<input name="licenseUrl" type="url" dir="ltr" defaultValue={asset.license_url ?? ''} /></label>
        </div>
      </ActionForm>
      <ActionButton run={() => deleteAssetAction(templateId, asset.id)} label={t('deleteAsset')} confirmText={t('confirmDeleteAsset')} />
    </div>
  );
}
