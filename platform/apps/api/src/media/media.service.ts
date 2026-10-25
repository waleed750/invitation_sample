import {
  ConflictException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException, PayloadTooLargeException,
  ServiceUnavailableException, UnprocessableEntityException
} from '@nestjs/common';
import {TIERS, fromDbTier, type Tier} from '@platform/shared';
import busboy from 'busboy';
import {randomUUID} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {rm, stat} from 'node:fs/promises';
import type {IncomingMessage} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Transform, type TransformCallback} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import sharp from 'sharp';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {MediaRepository, type MediaRow, type MediaVariant} from './media.repository';
import {SNIFF_BYTES, sniffMediaType, type MediaKind, type SniffedType} from './sniff';
import {MEDIA_STORAGE, type MediaStorage} from './storage/media-storage';

export const DAILY_UPLOAD_LIMIT = 30;
/** Image widths generated for every upload (never enlarged). */
export const IMAGE_WIDTHS = [480, 960, 1600] as const;
const MAX_INPUT_PIXELS = 60_000_000;
const TIER_RANK: Record<Tier, number> = {'save-the-date': 0, classic: 1, premium: 2};

export interface MediaLimits {
  tier: Tier;
  maxCount: number;
  maxBytes: Record<MediaKind, number>;
}

export interface MediaItem {
  id: string;
  kind: string | null;
  status: 'processing' | 'ready' | 'rejected';
  reason: string | null;
  url: string | null;
  variants: {width: number; url: string}[];
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  originalName: string | null;
  invitationId: string | null;
  createdAt: string;
}

export interface MediaListResponse {
  items: MediaItem[];
  usage: {count: number; maxCount: number; bytes: number; tier: Tier; maxBytes: Record<MediaKind, number>};
}

const unavailable = (): ServiceUnavailableException => new ServiceUnavailableException('Media service unavailable');

function fail(status: HttpStatus, code: string, message: string): HttpException {
  return new HttpException({code, message}, status);
}

interface ReceivedFile {
  sniffed: SniffedType;
  size: number;
  originalName: string | null;
}

class UploadRejected extends Error {
  constructor(readonly httpError: HttpException) {
    super(httpError.message);
  }
}

/** Streams an upload to disk while identifying it from its first bytes and enforcing the per-kind size cap. */
class UploadGate extends Transform {
  bytes = 0;
  sniffed: SniffedType | null = null;
  private head: Buffer[] = [];
  private headLength = 0;
  private limit = 0;
  private decided = false;

  constructor(private readonly decide: (sniffed: SniffedType | null) => number) {
    super();
  }

  private settle(): Error | null {
    this.decided = true;
    const head = Buffer.concat(this.head);
    this.sniffed = sniffMediaType(head.subarray(0, SNIFF_BYTES));
    try {
      this.limit = this.decide(this.sniffed);
    } catch (error) {
      return error as Error;
    }
    this.push(head);
    this.head = [];
    return null;
  }

  override _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.bytes += chunk.length;
    if (!this.decided) {
      this.head.push(chunk);
      this.headLength += chunk.length;
      if (this.headLength < SNIFF_BYTES) {
        callback();
        return;
      }
      const error = this.settle();
      if (error !== null) {
        callback(error);
        return;
      }
    } else {
      this.push(chunk);
    }
    if (this.bytes > this.limit) {
      callback(new UploadRejected(new PayloadTooLargeException({code: 'file_too_large', message: 'The file is larger than your plan allows'})));
      return;
    }
    callback();
  }

  override _flush(callback: TransformCallback): void {
    if (!this.decided) {
      const error = this.settle();
      if (error !== null) {
        callback(error);
        return;
      }
      if (this.bytes > this.limit) {
        callback(new UploadRejected(new PayloadTooLargeException({code: 'file_too_large', message: 'The file is larger than your plan allows'})));
        return;
      }
    }
    callback();
  }
}

function safeName(name: string | undefined): string | null {
  if (name === undefined) return null;
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
  return cleaned === '' ? null : cleaned;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly repository: MediaRepository,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    private readonly logger: AppLogger
  ) {}

  /** The customer's best plan (any paid invitation); before the first purchase the smallest plan applies. */
  async limitsFor(userId: string): Promise<MediaLimits> {
    const tiers = await this.repository.paidTiers(userId);
    let best: Tier = 'save-the-date';
    for (const value of tiers) {
      try {
        const tier = fromDbTier(value);
        if (TIER_RANK[tier] > TIER_RANK[best]) best = tier;
      } catch {
        // an unknown tier string never raises limits
      }
    }
    const plan = TIERS[best];
    return {tier: best, maxCount: plan.mediaMaxCount, maxBytes: {image: plan.imageMaxBytes, video: plan.videoMaxBytes, audio: plan.audioMaxBytes}};
  }

  private toItem(row: MediaRow): MediaItem {
    const ready = row.status === 'ready';
    return {
      id: row.id,
      kind: row.kind === 'music' ? 'audio' : row.kind,
      status: row.status,
      reason: row.reason,
      url: ready ? this.storage.urlFor(row.r2_key) : null,
      variants: ready ? row.variants.map((variant) => ({width: variant.width, url: this.storage.urlFor(variant.key)})) : [],
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
      originalName: row.original_name,
      invitationId: row.invitation_id,
      createdAt: row.created_at
    };
  }

  async list(user: RequestUser): Promise<MediaListResponse> {
    try {
      const [rows, usage, limits] = await Promise.all([this.repository.list(user.id), this.repository.usage(user.id), this.limitsFor(user.id)]);
      return {items: rows.map((row) => this.toItem(row)), usage: {count: usage.count, maxCount: limits.maxCount, bytes: usage.bytes, tier: limits.tier, maxBytes: limits.maxBytes}};
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('media list failed');
      throw unavailable();
    }
  }

  /** Deletes every stored file the user uploaded (account deletion). Rows are removed by `anonymize_account`. */
  async purgeFilesFor(userId: string): Promise<void> {
    const rows = await this.repository.list(userId);
    for (const row of rows) {
      const keys = new Set<string>([row.r2_key, ...row.variants.map((variant) => variant.key)]);
      for (const key of keys) await this.storage.delete(key).catch(() => undefined);
    }
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    try {
      const row = await this.repository.findOwned(user.id, id);
      if (row === null) throw new NotFoundException('Media not found');
      if (await this.repository.isReferenced(user.id, `media/${user.id}/${row.id}`)) {
        throw new ConflictException({code: 'media_in_use', message: 'This file is used by an invitation; remove it there first'});
      }
      const keys = new Set<string>([row.r2_key, ...row.variants.map((variant) => variant.key)]);
      for (const key of keys) await this.storage.delete(key);
      await this.repository.deleteRow(row.id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('media delete failed');
      throw unavailable();
    }
  }

  /** Receives one multipart file (`file`, optional `invitationId` before it), validates, stores and processes it. */
  async upload(user: RequestUser, request: IncomingMessage): Promise<MediaItem> {
    const contentType = request.headers['content-type'] ?? '';
    if (!/^multipart\/form-data/i.test(contentType)) {
      throw fail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'multipart_required', 'Send the file as multipart/form-data');
    }

    // Quotas first, so an over-quota request stores nothing.
    let limits: MediaLimits;
    try {
      const [usage, found] = await Promise.all([this.repository.usage(user.id), this.limitsFor(user.id)]);
      limits = found;
      if (usage.uploadsLast24h >= DAILY_UPLOAD_LIMIT) throw fail(HttpStatus.TOO_MANY_REQUESTS, 'daily_upload_limit', `At most ${String(DAILY_UPLOAD_LIMIT)} uploads per day`);
      if (usage.count >= limits.maxCount) throw new ForbiddenException({code: 'quota_exceeded', message: 'You reached the number of files your plan allows'});
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('media quota check failed');
      throw unavailable();
    }

    const tempPath = join(tmpdir(), `media-${randomUUID()}`);
    try {
      const received = await this.receive(request, limits, tempPath);
      return await this.process(user, received, tempPath);
    } finally {
      await rm(tempPath, {force: true});
    }
  }

  private receive(request: IncomingMessage, limits: MediaLimits, tempPath: string): Promise<{sniffed: SniffedType; size: number; invitationId: string | null; originalName: string | null}> {
    const hardMax = Math.max(limits.maxBytes.image, limits.maxBytes.video, limits.maxBytes.audio);
    return new Promise((resolve, reject) => {
      let invitationId: string | null = null;
      let received = null as ReceivedFile | null;
      let writing: Promise<void> | null = null;
      let settled = false;

      const parser = busboy({headers: request.headers, limits: {files: 1, fields: 4, fileSize: hardMax + 1, fieldSize: 200, parts: 6}});

      // Stops parsing, drains whatever the client is still sending (a stalled parser would hang the request) and fails once.
      const abort = (error: unknown): void => {
        if (settled) return;
        settled = true;
        request.unpipe(parser);
        parser.destroy();
        request.resume();
        reject(error instanceof UploadRejected ? error.httpError : error instanceof Error ? error : new Error(String(error)));
      };

      parser.on('field', (name, value) => {
        if (name === 'invitationId' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) invitationId = value.toLowerCase();
      });
      parser.on('file', (name, file, info) => {
        if (name !== 'file' || received !== null || writing !== null) {
          file.resume();
          return;
        }
        const gate = new UploadGate((sniffed) => {
          if (sniffed === null) throw new UploadRejected(fail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'unsupported_type', 'Only jpeg, png, webp, heic, mp4, webm, mp3 and m4a files are accepted'));
          const max = limits.maxBytes[sniffed.kind];
          if (max <= 0) throw new UploadRejected(new ForbiddenException({code: 'feature_not_in_plan', message: `Your plan does not include ${sniffed.kind} uploads`}));
          return max;
        });
        writing = pipeline(file, gate, createWriteStream(tempPath, {flags: 'wx', mode: 0o600})).then(
          () => {
            if (file.truncated) throw new UploadRejected(new PayloadTooLargeException({code: 'file_too_large', message: 'The file is larger than your plan allows'}));
            if (gate.sniffed === null) throw new UploadRejected(fail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'unsupported_type', 'Unsupported file'));
            received = {sniffed: gate.sniffed, size: gate.bytes, originalName: safeName(info.filename)};
          }
        ).catch(abort);
      });
      parser.on('error', abort);
      parser.on('close', () => {
        void (async () => {
          if (writing !== null) await writing;
          if (settled) return;
          const done = received;
          if (done === null || done.size === 0) {
            abort(fail(HttpStatus.BAD_REQUEST, 'file_required', 'Attach a file in the "file" field'));
            return;
          }
          settled = true;
          resolve({...done, invitationId});
        })();
      });
      request.on('aborted', () => {
        abort(fail(HttpStatus.BAD_REQUEST, 'upload_aborted', 'Upload aborted'));
      });
      request.pipe(parser);
    });
  }

  private async process(
    user: RequestUser,
    received: {sniffed: SniffedType; size: number; invitationId: string | null; originalName: string | null},
    tempPath: string
  ): Promise<MediaItem> {
    if (received.invitationId !== null && !(await this.repository.ownsInvitation(user.id, received.invitationId))) {
      throw new NotFoundException('Invitation not found');
    }
    const id = randomUUID();
    const base = `media/${user.id}/${id}`;
    const stored: string[] = [];
    try {
      await this.repository.insertProcessing({
        id, ownerId: user.id, invitationId: received.invitationId, key: `${base}/original.${received.sniffed.extension}`,
        kind: received.sniffed.kind, contentType: received.sniffed.contentType, originalName: received.originalName
      });
    } catch {
      this.logger.error('media insert failed');
      throw unavailable();
    }

    try {
      if (received.sniffed.kind === 'image') {
        const {variants, width, height, totalBytes} = await this.processImage(tempPath, base, stored);
        const largest = variants[variants.length - 1];
        await this.repository.markReady(id, {key: largest.key, sizeBytes: totalBytes, width, height, variants});
      } else {
        const key = `${base}/original.${received.sniffed.extension}`;
        const info = await stat(tempPath);
        await this.storage.putFile(key, tempPath, info.size, received.sniffed.contentType);
        stored.push(key);
        await this.repository.markReady(id, {key, sizeBytes: info.size, width: null, height: null, variants: []});
      }
    } catch (error) {
      for (const key of stored) await this.storage.delete(key).catch(() => undefined);
      const reason = error instanceof UploadRejected ? 'rejected' : received.sniffed.contentType === 'image/heic' ? 'heic_not_supported' : 'processing_failed';
      await this.repository.markRejected(id, reason).catch(() => undefined);
      this.logger.error(`media processing failed: ${reason}`);
      throw new UnprocessableEntityException({code: reason, message: reason === 'heic_not_supported' ? 'This server cannot read HEIC photos; export them as JPEG' : 'The file could not be processed'});
    }

    const row = await this.repository.findOwned(user.id, id);
    if (row === null) throw unavailable();
    return this.toItem(row);
  }

  /** Re-encodes to WebP at up to three widths. sharp drops EXIF/ICC metadata unless asked to keep it (privacy). */
  private async processImage(path: string, base: string, stored: string[]): Promise<{variants: MediaVariant[]; width: number; height: number; totalBytes: number}> {
    const source = sharp(path, {failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS}).rotate();
    const meta = await sharp(path, {failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS}).metadata();
    // sharp's metadata fields are optional at runtime (corrupt files), whatever the typings say.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    const oriented = (meta.orientation ?? 1) >= 5;
    const fullWidth = (oriented ? meta.height : meta.width) ?? 0;
    const fullHeight = (oriented ? meta.width : meta.height) ?? 0;
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
    if (fullWidth === 0 || fullHeight === 0) throw new Error('unreadable image');
    const widths = [...new Set(IMAGE_WIDTHS.map((width) => Math.min(width, fullWidth)))].sort((a, b) => a - b);
    const variants: MediaVariant[] = [];
    let totalBytes = 0;
    for (const width of widths) {
      const output = await source.clone().resize({width, withoutEnlargement: true}).webp({quality: 80}).toBuffer();
      const key = `${base}/w${String(width)}.webp`;
      await this.storage.putBuffer(key, output, 'image/webp');
      stored.push(key);
      variants.push({width, key, bytes: output.length});
      totalBytes += output.length;
    }
    return {variants, width: fullWidth, height: fullHeight, totalBytes};
  }
}
