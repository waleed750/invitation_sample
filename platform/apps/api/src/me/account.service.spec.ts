import {BadRequestException, ForbiddenException, ServiceUnavailableException} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {AccountService} from './account.service';

function setup(repo: Partial<Record<'exportData' | 'profileEmail' | 'anonymize', jest.Mock>> = {}) {
  const repository = {
    exportData: jest.fn().mockResolvedValue({profile: {id: 'u1'}, orders: []}),
    profileEmail: jest.fn().mockResolvedValue('sara@example.test'),
    anonymize: jest.fn().mockResolvedValue({ok: true}),
    ...repo
  };
  const media = {purgeFilesFor: jest.fn().mockResolvedValue(undefined)};
  const logger = {error: jest.fn()} as unknown as AppLogger;
  const service = new AccountService(repository as never, media as never, logger);
  return {service, repository, media};
}

const user = {id: 'u1', email: 'Sara@Example.test', jwt: 'x'};

describe('AccountService', () => {
  it('exports only the signed-in user\'s own data', async () => {
    const {service, repository} = setup();
    await expect(service.exportData(user)).resolves.toEqual({profile: {id: 'u1'}, orders: []});
    expect(repository.exportData).toHaveBeenCalledWith('u1');
  });

  it('answers 503 (no details) when the export fails', async () => {
    const {service} = setup({exportData: jest.fn().mockRejectedValue(new Error('db password in message'))});
    await expect(service.exportData(user)).rejects.toThrow(ServiceUnavailableException);
  });

  it('deletes only after the account email is typed (case-insensitive), files first', async () => {
    const {service, repository, media} = setup();
    await expect(service.deleteAccount(user, {confirmEmail: ' sara@example.TEST '})).resolves.toEqual({ok: true});
    expect(media.purgeFilesFor).toHaveBeenCalledWith('u1');
    expect(repository.anonymize).toHaveBeenCalledWith('u1');
    expect(media.purgeFilesFor.mock.invocationCallOrder[0]).toBeLessThan(repository.anonymize.mock.invocationCallOrder[0]);
  });

  it('refuses a wrong email without touching anything', async () => {
    const {service, repository, media} = setup();
    await expect(service.deleteAccount(user, {confirmEmail: 'other@example.test'})).rejects.toThrow(BadRequestException);
    expect(media.purgeFilesFor).not.toHaveBeenCalled();
    expect(repository.anonymize).not.toHaveBeenCalled();
  });

  it('falls back to the profile email when the session has none', async () => {
    const {service} = setup();
    await expect(service.deleteAccount({id: 'u1', jwt: 'x'}, {confirmEmail: 'sara@example.test'})).resolves.toEqual({ok: true});
  });

  it('never deletes an admin account', async () => {
    const {service} = setup({anonymize: jest.fn().mockResolvedValue({ok: false, reason: 'admin_account'})});
    await expect(service.deleteAccount(user, {confirmEmail: 'sara@example.test'})).rejects.toThrow(ForbiddenException);
  });
});
