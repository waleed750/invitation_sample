import {createReadStream} from 'node:fs';
import {copyFile, mkdir, rename, rm, stat, writeFile} from 'node:fs/promises';
import {dirname, join, resolve, sep} from 'node:path';
import {DeleteObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import type {Readable} from 'node:stream';

/** Where uploaded files live. Keys are relative paths such as `media/<user>/<id>/w480.webp`. */
export interface MediaStorage {
  /** Stores a buffer. */
  putBuffer(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Stores an existing local file (streamed, never read into memory). */
  putFile(key: string, path: string, size: number, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  /** Public URL a browser can load. */
  urlFor(key: string): string;
}

export const MEDIA_STORAGE = 'MEDIA_STORAGE';

const SAFE_KEY = /^[a-z0-9][a-z0-9/_.-]*$/;

/** Throws unless the key is a plain relative path (no `..`, no leading slash, no odd characters). */
export function assertSafeKey(key: string): void {
  if (!SAFE_KEY.test(key) || key.split('/').some((part) => part === '' || part === '.' || part === '..') || key.length > 300) {
    throw new Error('unsafe storage key');
  }
}

/** A directory on the server's disk (a VPS volume); Caddy serves it at `/media/*` in production. */
export class LocalDiskMediaStorage implements MediaStorage {
  private readonly root: string;

  constructor(directory: string, private readonly publicBaseUrl: string) {
    this.root = resolve(directory);
  }

  private pathFor(key: string): string {
    assertSafeKey(key);
    const full = resolve(join(this.root, key));
    if (!full.startsWith(this.root + sep)) throw new Error('unsafe storage key');
    return full;
  }

  async putBuffer(key: string, body: Buffer): Promise<void> {
    const target = this.pathFor(key);
    await mkdir(dirname(target), {recursive: true});
    await writeFile(target, body);
  }

  async putFile(key: string, path: string): Promise<void> {
    const target = this.pathFor(key);
    await mkdir(dirname(target), {recursive: true});
    try {
      await rename(path, target);
    } catch {
      await copyFile(path, target);
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), {force: true});
  }

  urlFor(key: string): string {
    assertSafeKey(key);
    return `${this.publicBaseUrl.replace(/\/+$/, '')}/${key}`;
  }

  /** For tests and the optional dev static route. */
  async exists(key: string): Promise<boolean> {
    return stat(this.pathFor(key)).then(() => true, () => false);
  }

  get directory(): string {
    return this.root;
  }
}

export interface S3MediaStorageOptions {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
}

/** Any S3-compatible bucket (Contabo, Backblaze B2, Cloudflare R2, MinIO...). */
export class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client;

  constructor(private readonly options: S3MediaStorageOptions, client?: S3Client) {
    this.client =
      client ??
      new S3Client({
        region: options.region,
        ...(options.endpoint === undefined ? {} : {endpoint: options.endpoint}),
        forcePathStyle: options.forcePathStyle,
        credentials: {accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey}
      });
  }

  async putBuffer(key: string, body: Buffer, contentType: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(new PutObjectCommand({Bucket: this.options.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable'}));
  }

  async putFile(key: string, path: string, size: number, contentType: string): Promise<void> {
    assertSafeKey(key);
    const stream: Readable = createReadStream(path);
    await this.client.send(
      new PutObjectCommand({Bucket: this.options.bucket, Key: key, Body: stream, ContentLength: size, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable'})
    );
    await rm(path, {force: true});
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(new DeleteObjectCommand({Bucket: this.options.bucket, Key: key}));
  }

  urlFor(key: string): string {
    assertSafeKey(key);
    return `${this.options.publicBaseUrl.replace(/\/+$/, '')}/${key}`;
  }
}
