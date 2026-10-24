/* eslint-disable */
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assertSafeKey, LocalDiskMediaStorage, S3MediaStorage} from './media-storage';

describe('assertSafeKey', () => {
  it('accepts normal keys and rejects traversal and odd characters', () => {
    expect(() => assertSafeKey('media/u1/abc/w480.webp')).not.toThrow();
    for (const bad of ['../etc/passwd', '/abs', 'a/../b', 'a//b', 'a/./b', 'A/B', 'a b', 'a\\b', '', 'a/'.repeat(200)]) {
      expect(() => assertSafeKey(bad)).toThrow('unsafe storage key');
    }
  });
});

describe('LocalDiskMediaStorage', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'media-test-'));
  });
  afterEach(async () => {
    await rm(dir, {recursive: true, force: true});
  });

  it('stores, serves a URL for, and deletes a buffer', async () => {
    const storage = new LocalDiskMediaStorage(dir, 'https://cdn.example.test/media/');
    await storage.putBuffer('media/u1/a/w480.webp', Buffer.from('hello'));
    expect((await readFile(join(dir, 'media/u1/a/w480.webp'))).toString()).toBe('hello');
    expect(await storage.exists('media/u1/a/w480.webp')).toBe(true);
    expect(storage.urlFor('media/u1/a/w480.webp')).toBe('https://cdn.example.test/media/media/u1/a/w480.webp');
    await storage.delete('media/u1/a/w480.webp');
    expect(await storage.exists('media/u1/a/w480.webp')).toBe(false);
    await storage.delete('media/u1/a/w480.webp'); // idempotent
  });

  it('moves an existing file in without reading it into memory', async () => {
    const storage = new LocalDiskMediaStorage(dir, 'http://x/media');
    const source = join(dir, 'source.bin');
    await writeFile(source, 'video-bytes');
    await storage.putFile('media/u1/v/original.mp4', source);
    expect((await readFile(join(dir, 'media/u1/v/original.mp4'))).toString()).toBe('video-bytes');
  });

  it('refuses keys that escape the directory', async () => {
    const storage = new LocalDiskMediaStorage(dir, 'http://x/media');
    await expect(storage.putBuffer('../escape.txt', Buffer.from('x'))).rejects.toThrow('unsafe storage key');
    await expect(storage.delete('../escape.txt')).rejects.toThrow('unsafe storage key');
  });
});

describe('S3MediaStorage', () => {
  it('sends put and delete commands with the right bucket and key, and builds URLs', async () => {
    const sent: {name: string; input: Record<string, unknown>}[] = [];
    const client = {send: (command: {constructor: {name: string}; input: Record<string, unknown>}) => {
      sent.push({name: command.constructor.name, input: command.input});
      return Promise.resolve({});
    }};
    const storage = new S3MediaStorage(
      {region: 'eu', bucket: 'b', accessKeyId: 'k', secretAccessKey: 's', forcePathStyle: true, publicBaseUrl: 'https://files.example.test/'},
      client as never
    );
    await storage.putBuffer('media/u/a/w480.webp', Buffer.from('x'), 'image/webp');
    await storage.delete('media/u/a/w480.webp');
    expect(sent[0]).toMatchObject({name: 'PutObjectCommand', input: {Bucket: 'b', Key: 'media/u/a/w480.webp', ContentType: 'image/webp'}});
    expect(sent[1]).toMatchObject({name: 'DeleteObjectCommand', input: {Bucket: 'b', Key: 'media/u/a/w480.webp'}});
    expect(storage.urlFor('media/u/a/w480.webp')).toBe('https://files.example.test/media/u/a/w480.webp');
    await expect(storage.putBuffer('../x', Buffer.from('x'), 'image/webp')).rejects.toThrow('unsafe storage key');
  });
});
