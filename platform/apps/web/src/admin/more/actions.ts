'use server';

import {revalidatePath} from 'next/cache';
import {adminCall, numberOrUndefined, optional, type ActionResult} from './call';

function done(result: ActionResult, path: string): ActionResult {
  if (result.ok) revalidatePath(path, 'page');
  return result;
}

const str = (form: FormData, key: string): string => String(form.get(key) ?? '').trim();

// ---- settings
export async function saveSettingAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const key = str(form, 'key');
  let value: unknown;
  if (key === 'support_whatsapp') value = str(form, 'value');
  else if (key === 'payment_instructions') value = {ar: str(form, 'ar'), en: str(form, 'en')};
  else if (key === 'email_texts') {
    const entries: Record<string, {ar: string; en: string}> = {};
    for (const name of ['order_paid', 'topup_confirmed', 'invitation_published']) {
      const ar = str(form, `${name}_ar`);
      const en = str(form, `${name}_en`);
      if (ar !== '' || en !== '') entries[name] = {ar, en};
    }
    value = entries;
  } else return {ok: false, error: 'unknown_key'};
  return done(await adminCall('PUT', `/v1/admin/settings/${encodeURIComponent(key)}`, {value}), '/[locale]/admin/settings');
}

// ---- coupons
export async function createCouponAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const percent = numberOrUndefined(form.get('percent'));
  const amount = numberOrUndefined(form.get('amount'));
  const expires = optional(form.get('expiresAt'));
  const result = await adminCall('POST', '/v1/admin/coupons', {
    code: str(form, 'code'),
    ...(percent === undefined ? {} : {percentOff: percent}),
    ...(amount === undefined ? {} : {amountOffMinor: Math.round(amount * 100)}),
    ...(numberOrUndefined(form.get('maxUses')) === undefined ? {} : {maxUses: numberOrUndefined(form.get('maxUses'))}),
    ...(expires === undefined ? {} : {expiresAt: new Date(`${expires}T23:59:59+02:00`).toISOString()}),
  });
  return done(result, '/[locale]/admin/coupons');
}

export async function setCouponActiveAction(code: string, active: boolean): Promise<ActionResult> {
  return done(await adminCall('POST', `/v1/admin/coupons/${encodeURIComponent(code)}/active`, {active}), '/[locale]/admin/coupons');
}

// ---- templates
function templateBody(form: FormData): Record<string, unknown> {
  const sort = numberOrUndefined(form.get('sortOrder'));
  const parseJson = (key: string): Record<string, unknown> | undefined => {
    const raw = optional(form.get(key));
    if (raw === undefined) return undefined;
    try {
      const parsed: unknown = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  };
  return {
    nameAr: str(form, 'nameAr'), nameEn: str(form, 'nameEn'),
    ...(optional(form.get('taglineAr')) === undefined ? {} : {taglineAr: str(form, 'taglineAr')}),
    ...(optional(form.get('taglineEn')) === undefined ? {} : {taglineEn: str(form, 'taglineEn')}),
    tier: str(form, 'tier'),
    ...(optional(form.get('category')) === undefined ? {} : {category: str(form, 'category')}),
    ...(optional(form.get('eventType')) === undefined ? {} : {eventType: str(form, 'eventType')}),
    ...(sort === undefined ? {} : {sortOrder: Math.round(sort)}),
    featured: form.get('featured') === 'on',
    ...(parseJson('sampleDataAr') === undefined ? {} : {sampleDataAr: parseJson('sampleDataAr')}),
    ...(parseJson('sampleDataEn') === undefined ? {} : {sampleDataEn: parseJson('sampleDataEn')}),
  };
}

export async function createTemplateAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  return done(await adminCall('POST', '/v1/admin/templates', {slug: str(form, 'slug'), ...templateBody(form)}), '/[locale]/admin/templates');
}

export async function updateTemplateAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const id = str(form, 'id');
  return done(await adminCall('PUT', `/v1/admin/templates/${encodeURIComponent(id)}`, templateBody(form)), '/[locale]/admin/templates/[id]');
}

export async function setTemplateStatusAction(id: string, status: 'draft' | 'live' | 'retired'): Promise<ActionResult> {
  return done(await adminCall('POST', `/v1/admin/templates/${encodeURIComponent(id)}/status`, {status}), '/[locale]/admin/templates/[id]');
}

export async function addAssetAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const id = str(form, 'templateId');
  const kind = optional(form.get('kind'));
  const result = await adminCall('POST', `/v1/admin/templates/${encodeURIComponent(id)}/assets`, {
    r2Key: str(form, 'r2Key'),
    ...(kind === undefined ? {} : {kind}),
    ...(optional(form.get('source')) === undefined ? {} : {source: str(form, 'source')}),
    ...(optional(form.get('license')) === undefined ? {} : {license: str(form, 'license')}),
    ...(optional(form.get('licenseUrl')) === undefined ? {} : {licenseUrl: str(form, 'licenseUrl')}),
  });
  return done(result, '/[locale]/admin/templates/[id]');
}

export async function updateAssetAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const result = await adminCall('PATCH', `/v1/admin/templates/${encodeURIComponent(str(form, 'templateId'))}/assets/${encodeURIComponent(str(form, 'assetId'))}`, {
    source: str(form, 'source'), license: str(form, 'license'),
    ...(optional(form.get('licenseUrl')) === undefined ? {} : {licenseUrl: str(form, 'licenseUrl')}),
  });
  return done(result, '/[locale]/admin/templates/[id]');
}

export async function deleteAssetAction(templateId: string, assetId: string): Promise<ActionResult> {
  return done(await adminCall('DELETE', `/v1/admin/templates/${encodeURIComponent(templateId)}/assets/${encodeURIComponent(assetId)}`), '/[locale]/admin/templates/[id]');
}

// ---- affiliates
export async function createAffiliateAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const commission = numberOrUndefined(form.get('commissionPct'));
  const discount = numberOrUndefined(form.get('customerDiscountPct'));
  const result = await adminCall('POST', '/v1/admin/affiliates', {
    refCode: str(form, 'refCode'), name: str(form, 'name'),
    ...(optional(form.get('phone')) === undefined ? {} : {phone: str(form, 'phone')}),
    ...(commission === undefined ? {} : {commissionPct: commission}),
    ...(discount === undefined ? {} : {customerDiscountPct: discount}),
    ...(optional(form.get('payoutMethod')) === undefined ? {} : {payoutMethod: str(form, 'payoutMethod')}),
    ...(optional(form.get('payoutAccount')) === undefined ? {} : {payoutDetails: {account: str(form, 'payoutAccount')}}),
  });
  return done(result, '/[locale]/admin/affiliates');
}

export async function setAffiliateActiveAction(id: string, name: string, active: boolean): Promise<ActionResult> {
  return done(await adminCall('PUT', `/v1/admin/affiliates/${encodeURIComponent(id)}`, {name, active}), '/[locale]/admin/affiliates/[id]');
}

export async function recordPayoutAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const amount = numberOrUndefined(form.get('amountEgp'));
  if (amount === undefined) return {ok: false, error: 'invalid_amount'};
  const result = await adminCall('POST', `/v1/admin/affiliates/${encodeURIComponent(str(form, 'id'))}/payouts`, {
    amountEgp: amount,
    ...(optional(form.get('method')) === undefined ? {} : {method: str(form, 'method')}),
    ...(optional(form.get('reference')) === undefined ? {} : {reference: str(form, 'reference')}),
  });
  return done(result, '/[locale]/admin/affiliates/[id]');
}

// ---- refunds
export async function refundManuallyAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const result = await adminCall('POST', `/v1/admin/refunds/${encodeURIComponent(str(form, 'orderId'))}/manual`, {note: str(form, 'note')});
  return done(result, '/[locale]/admin/refunds');
}

export async function refundToBalanceAction(_previous: unknown, form: FormData): Promise<ActionResult> {
  const result = await adminCall('POST', `/v1/admin/orders/${encodeURIComponent(str(form, 'orderId'))}/refund-to-balance`, {note: str(form, 'note')});
  return done(result, '/[locale]/admin/refunds');
}
