import {ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException, BadRequestException} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {MediaService} from '../media/media.service';
import {AccountRepository} from './account.repository';

const deleteSchema = z.object({confirmEmail: z.string().trim().min(3).max(254)}).strict();
export class DeleteAccountBody extends createZodDto(deleteSchema) {}

/** Export and deletion of the caller's own account (T21). */
@Injectable()
export class AccountService {
  constructor(
    private readonly repository: AccountRepository,
    private readonly media: MediaService,
    private readonly logger: AppLogger
  ) {}

  /** Everything we hold about the caller: profile, orders, invitations, balance and points history, media list. Never other people's data. */
  async exportData(user: RequestUser): Promise<Record<string, unknown>> {
    try {
      const data = await this.repository.exportData(user.id);
      if (data === null) throw new NotFoundException('Account not found');
      return data;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('account export failed (upstream error)');
      throw new ServiceUnavailableException('Account service unavailable');
    }
  }

  /**
   * Deletes the caller's account after they type their account email. Personal data and sign-in are removed; paid orders and
   * the credit ledger stay (legal record) under an emptied profile. Uploaded files are removed from storage first.
   */
  async deleteAccount(user: RequestUser, body: DeleteAccountBody): Promise<{ok: true}> {
    let expected: string | null;
    try {
      expected = user.email ?? (await this.repository.profileEmail(user.id));
    } catch {
      this.logger.error('account lookup failed (upstream error)');
      throw new ServiceUnavailableException('Account service unavailable');
    }
    if (expected?.trim().toLowerCase() !== body.confirmEmail.trim().toLowerCase()) {
      throw new BadRequestException({code: 'confirmation_mismatch', message: 'The email does not match this account'});
    }
    try {
      await this.media.purgeFilesFor(user.id);
      const result = await this.repository.anonymize(user.id);
      if (result === null) throw new ServiceUnavailableException('Account service unavailable');
      if (result.ok !== true) {
        if (result.reason === 'admin_account') {
          throw new ForbiddenException({code: 'admin_account', message: 'An admin account cannot be deleted here'});
        }
        throw new NotFoundException('Account not found');
      }
      return {ok: true};
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException || error instanceof ServiceUnavailableException) throw error;
      this.logger.error('account deletion failed (upstream error)');
      throw new ServiceUnavailableException('Account service unavailable');
    }
  }
}
