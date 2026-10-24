import {NotFoundException} from '@nestjs/common';
import {createHash} from 'node:crypto';
import {EditLinksService, hashToken} from './edit-links.service';

describe('EditLinksService', () => {
  it('issues a 32-byte url-safe secret and stores only its sha-256', async () => {
    const repository = {issue: jest.fn().mockResolvedValue({ok: true, id: 'l1', expires_at: '2027-01-01T00:00:00Z'})};
    const service = new EditLinksService(repository as never);
    const result = await service.issue({id: 'admin', jwt: ''}, 'inv', {label: 'Sara'});
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.path).toBe(`/edit/${result.token}`);
    const [, , storedHash] = repository.issue.mock.calls[0] as [string, string, string];
    expect(storedHash).toBe(createHash('sha256').update(result.token).digest('hex'));
    expect(storedHash).not.toContain(result.token);
  });

  it('two links never share a secret', async () => {
    const repository = {issue: jest.fn().mockResolvedValue({ok: true, id: 'l', expires_at: 'x'})};
    const service = new EditLinksService(repository as never);
    const a = await service.issue({id: 'admin', jwt: ''}, 'inv', {});
    const b = await service.issue({id: 'admin', jwt: ''}, 'inv', {});
    expect(a.token).not.toBe(b.token);
  });

  it('claim only succeeds for the invitation the link belongs to', async () => {
    const repository = {claim: jest.fn().mockResolvedValue({ok: true, invitation_id: 'inv-a'})};
    const service = new EditLinksService(repository as never);
    await expect(service.claim({id: 'u', jwt: ''}, 'inv-a', {token: 't'})).resolves.toEqual({invitationId: 'inv-a'});
    await expect(service.claim({id: 'u', jwt: ''}, 'inv-b', {token: 't'})).rejects.toThrow(NotFoundException);
    expect(repository.claim).toHaveBeenCalledWith('u', hashToken('t'));
  });
});
