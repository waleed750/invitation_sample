/* eslint-disable */
import {BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException} from '@nestjs/common';
import {AdminPaymentsService} from './admin-payments.service';

describe('AdminPaymentsService', () => {
  let repository: any;
  let service: AdminPaymentsService;
  const body = (extra: object = {}) => ({paidAmountMinor: 129900, txnRef: 'T1', ...extra}) as any;

  beforeEach(() => {
    repository = {
      listPendingManualOrdersAsServiceRole: jest.fn(),
      confirmManualPaymentAsServiceRole: jest.fn(),
      rejectManualPaymentAsServiceRole: jest.fn()
    };
    service = new AdminPaymentsService(repository, {error: jest.fn()} as any);
  });

  it('lists pending orders with customer and age', async () => {
    const created = new Date(Date.now() - 50 * 3_600_000).toISOString();
    repository.listPendingManualOrdersAsServiceRole.mockResolvedValue([
      {id: 'o1', provider_ref: 'INV-ABC234', amount_minor: 129900, currency: 'EGP', created_at: created,
        profiles: {id: 'u1', name: 'Mona', phone: '+201000000001', email: null}}
    ]);
    const [row] = await service.listPending();
    expect(row).toEqual({
      id: 'o1', reference: 'INV-ABC234', amountMinor: 129900, currency: 'EGP', createdAt: created, ageHours: 50,
      customer: {id: 'u1', name: 'Mona', phone: '+201000000001', email: null}
    });
  });

  it('maps a list query failure to 503', async () => {
    repository.listPendingManualOrdersAsServiceRole.mockRejectedValue(new Error('x'));
    await expect(service.listPending()).rejects.toThrow(ServiceUnavailableException);
  });

  it('confirms with the admin id and normalised arguments', async () => {
    repository.confirmManualPaymentAsServiceRole.mockResolvedValue({ok: true, order_id: 'o1'});
    await expect(service.confirm('admin-1', 'o1', body())).resolves.toEqual({ok: true, already: false});
    expect(repository.confirmManualPaymentAsServiceRole).toHaveBeenCalledWith({
      orderId: 'o1', adminId: 'admin-1', paidAmountMinor: 129900, txnRef: 'T1', note: null, acceptMismatch: false
    });
  });

  it('reports an already-paid order as a no-op success', async () => {
    repository.confirmManualPaymentAsServiceRole.mockResolvedValue({ok: true, already: true});
    await expect(service.confirm('admin-1', 'o1', body())).resolves.toEqual({ok: true, already: true});
  });

  it('maps amount_mismatch to 409 with that code', async () => {
    repository.confirmManualPaymentAsServiceRole.mockResolvedValue({ok: false, reason: 'amount_mismatch'});
    const error: any = await service.confirm('admin-1', 'o1', body({paidAmountMinor: 5})).catch((e) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({code: 'amount_mismatch'});
  });

  it('maps note_required to 409 with that code', async () => {
    repository.confirmManualPaymentAsServiceRole.mockResolvedValue({ok: false, reason: 'note_required'});
    const error: any = await service.confirm('admin-1', 'o1', body({acceptMismatch: true})).catch((e) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({code: 'note_required'});
  });

  it('maps not_found, not_pending and invalid_amount', async () => {
    repository.confirmManualPaymentAsServiceRole.mockResolvedValueOnce({ok: false, reason: 'not_found'});
    await expect(service.confirm('a', 'o1', body())).rejects.toThrow(NotFoundException);
    repository.confirmManualPaymentAsServiceRole.mockResolvedValueOnce({ok: false, reason: 'not_pending'});
    await expect(service.confirm('a', 'o1', body())).rejects.toThrow(ConflictException);
    repository.confirmManualPaymentAsServiceRole.mockResolvedValueOnce({ok: false, reason: 'invalid_amount'});
    await expect(service.confirm('a', 'o1', body())).rejects.toThrow(BadRequestException);
  });

  it('maps a failed or empty RPC to 503', async () => {
    repository.confirmManualPaymentAsServiceRole.mockResolvedValue(null);
    await expect(service.confirm('a', 'o1', body())).rejects.toThrow(ServiceUnavailableException);
  });

  it('maps a thrown database error during an RPC to 503', async () => {
    repository.rejectManualPaymentAsServiceRole.mockRejectedValue(new Error('connection refused'));
    await expect(service.reject('a', 'o1', {reason: 'no payment'} as any)).rejects.toThrow(ServiceUnavailableException);
  });

  it('rejects a payment', async () => {
    repository.rejectManualPaymentAsServiceRole.mockResolvedValue({ok: true});
    await expect(service.reject('admin-1', 'o1', {reason: 'no payment'} as any)).resolves.toEqual({ok: true});
    expect(repository.rejectManualPaymentAsServiceRole).toHaveBeenCalledWith('o1', 'admin-1', 'no payment');
  });

  it('maps a reject of a non-pending order to 409', async () => {
    repository.rejectManualPaymentAsServiceRole.mockResolvedValue({ok: false, reason: 'not_pending'});
    await expect(service.reject('a', 'o1', {reason: 'no payment'} as any)).rejects.toThrow(ConflictException);
  });
});
