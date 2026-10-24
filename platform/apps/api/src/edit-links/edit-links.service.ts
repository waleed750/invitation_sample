import {Injectable, NotFoundException} from '@nestjs/common';
import {createZodDto} from 'nestjs-zod';
import {createHash, randomBytes} from 'node:crypto';
import {z} from 'zod';
import type {RequestUser} from '../common/decorators';
import {unwrapRpc} from '../common/rpc-result';
import {EditLinksRepository, type EditLinkRow} from './edit-links.repository';

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'not an edit link token');
export class ResolveBody extends createZodDto(z.object({token: tokenSchema}).strict()) {}
export class ClaimBody extends createZodDto(z.object({token: tokenSchema}).strict()) {}
export class IssueBody extends createZodDto(z.object({label: z.string().trim().max(80).optional()}).strict()) {}
export class InvitationParams extends createZodDto(z.object({id: z.uuid()})) {}
export class LinkParams extends createZodDto(z.object({linkId: z.uuid()})) {}

export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

@Injectable()
export class EditLinksService {
  constructor(private readonly repository: EditLinksRepository) {}

  /** The secret is shown once, here; afterwards only its hash exists. */
  async issue(admin: RequestUser, invitationId: string, body: IssueBody): Promise<{id: string; token: string; path: string; expiresAt: string}> {
    const token = randomBytes(32).toString('base64url');
    const result = unwrapRpc(await this.repository.issue(admin.id, invitationId, hashToken(token), body.label ?? null));
    return {id: String(result.id), token, path: `/edit/${token}`, expiresAt: String(result.expires_at)};
  }

  list(invitationId: string): Promise<EditLinkRow[]> {
    return this.repository.list(invitationId);
  }

  async revoke(admin: RequestUser, linkId: string): Promise<{ok: true}> {
    unwrapRpc(await this.repository.revoke(admin.id, linkId));
    return {ok: true};
  }

  /** Which invitation a link opens. A bad, revoked or expired link is simply "not found". */
  async resolve(body: ResolveBody): Promise<{invitationId: string}> {
    const result = await this.repository.resolve(hashToken(body.token));
    if (result?.found !== true || typeof result.invitation_id !== 'string') throw new NotFoundException({code: 'link_invalid', message: 'This link is not valid'});
    return {invitationId: result.invitation_id};
  }

  async claim(user: RequestUser, invitationId: string, body: ClaimBody): Promise<{invitationId: string}> {
    const result = await this.repository.claim(user.id, hashToken(body.token));
    if (result?.ok !== true || result.invitation_id !== invitationId) throw new NotFoundException({code: 'link_invalid', message: 'This link is not valid'});
    return {invitationId};
  }
}
