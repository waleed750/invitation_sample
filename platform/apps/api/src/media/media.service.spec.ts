/* eslint-disable */
import {HttpException} from '@nestjs/common';
import express from 'express';
import {mkdtemp, readdir, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import {MediaService} from './media.service';
import type {MediaRepository, MediaRow, MediaUsage, NewMedia, ReadyMedia} from './media.repository';
import {LocalDiskMediaStorage} from './storage/media-storage';

const OWNER = {id: '11111111-1111-4111-8111-111111111111', jwt: 'x'} as never;
const OTHER = {id: '22222222-2222-4222-8222-222222222222', jwt: 'y'} as never;
const OWN_INVITATION = '33333333-3333-4333-8333-333333333333';

class FakeRepository {
  rows: MediaRow[] = [];
  tiers: string[] = [];
  usageOverride: Partial<MediaUsage> = {};
  referenced = false;

  paidTiers = () => Promise.resolve(this.tiers);
  usage = (userId: string) => {
    const mine = this.rows.filter((row) => row.owner_id === userId && row.status !== 'rejected');
    return Promise.resolve({count: mine.length, bytes: mine.reduce((sum, row) => sum + (row.size_bytes ?? 0), 0), uploadsLast24h: mine.length, ...this.usageOverride});
  };
  ownsInvitation = (_userId: string, id: string) => Promise.resolve(id === OWN_INVITATION);
  list = (userId: string) => Promise.resolve(this.rows.filter((row) => row.owner_id === userId));
  findOwned = (userId: string, id: string) => Promise.resolve(this.rows.find((row) => row.id === id && row.owner_id === userId) ?? null);
  isReferenced = () => Promise.resolve(this.referenced);
  insertProcessing = (media: NewMedia) => {
    this.rows.push({
      id: media.id, owner_id: media.ownerId, invitation_id: media.invitationId, r2_key: media.key, kind: media.kind, size_bytes: null,
      status: 'processing', original_name: media.originalName, content_type: media.contentType, width: null, height: null, variants: [], reason: null,
      created_at: new Date().toISOString()
    });
    return Promise.resolve();
  };
  markReady = (id: string, ready: ReadyMedia) => {
    const row = this.rows.find((item) => item.id === id);
    if (row) Object.assign(row, {status: 'ready', r2_key: ready.key, size_bytes: ready.sizeBytes, width: ready.width, height: ready.height, variants: ready.variants});
    return Promise.resolve();
  };
  markRejected = (id: string, reason: string) => {
    const row = this.rows.find((item) => item.id === id);
    if (row) Object.assign(row, {status: 'rejected', reason});
    return Promise.resolve();
  };
  deleteRow = (id: string) => {
    this.rows = this.rows.filter((row) => row.id !== id);
    return Promise.resolve();
  };
}

async function jpegWithExif(width = 2000, height = 1200): Promise<Buffer> {
  return sharp({create: {width, height, channels: 3, background: {r: 200, g: 30, b: 30}}})
    .withExif({IFD0: {Copyright: 'secret-owner-name'}})
    .jpeg()
    .toBuffer();
}

describe('MediaService (real sharp, real disk, fake database)', () => {
  let dir: string;
  let repo: FakeRepository;
  let storage: LocalDiskMediaStorage;
  let service: MediaService;
  let app: express.Express;
  let currentUser: unknown;

  const files = async (): Promise<string[]> => {
    try {
      const out: string[] = [];
      const walk = async (path: string): Promise<void> => {
        for (const entry of await readdir(path, {withFileTypes: true})) {
          if (entry.isDirectory()) await walk(join(path, entry.name));
          else out.push(join(path, entry.name));
        }
      };
      await walk(dir);
      return out;
    } catch {
      return [];
    }
  };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'media-svc-'));
    repo = new FakeRepository();
    storage = new LocalDiskMediaStorage(dir, 'http://files.test/media');
    service = new MediaService(repo as unknown as MediaRepository, storage, {error: jest.fn()} as never);
    currentUser = OWNER;
    app = express();
    app.post('/upload', (req, res) => {
      service.upload(currentUser as never, req).then(
        (item) => res.status(201).json(item),
        (error: unknown) => {
          const status = error instanceof HttpException ? error.getStatus() : 500;
          res.status(status).json(error instanceof HttpException ? error.getResponse() : {message: String(error)});
        }
      );
    });
  });
  afterEach(async () => {
    await rm(dir, {recursive: true, force: true});
  });

  it('stores an image as WebP at three sizes with EXIF removed', async () => {
    const original = await jpegWithExif();
    expect((await sharp(original).metadata()).exif).toBeDefined();
    const res = await request(app).post('/upload').attach('file', original, {filename: 'photo.jpg', contentType: 'image/jpeg'});
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({kind: 'image', status: 'ready', width: 2000, height: 1200, originalName: 'photo.jpg'});
    expect(res.body.variants.map((v: {width: number}) => v.width)).toEqual([480, 960, 1600]);
    const onDisk = await files();
    expect(onDisk).toHaveLength(3);
    for (const path of onDisk) {
      const meta = await sharp(await readFile(path)).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();
      expect((await readFile(path)).includes(Buffer.from('secret-owner-name'))).toBe(false);
    }
    expect(res.body.url).toMatch(/^http:\/\/files\.test\/media\/media\/.+\/w1600\.webp$/);
  });

  it('never enlarges a small image', async () => {
    const small = await sharp({create: {width: 300, height: 200, channels: 3, background: '#fff'}}).png().toBuffer();
    const res = await request(app).post('/upload').attach('file', small, 'small.png');
    expect(res.status).toBe(201);
    expect(res.body.variants.map((v: {width: number}) => v.width)).toEqual([300]);
  });

  it('rejects an executable renamed .jpg and stores nothing', async () => {
    const fake = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(2000, 1)]);
    const res = await request(app).post('/upload').attach('file', fake, {filename: 'photo.jpg', contentType: 'image/jpeg'});
    expect(res.status).toBe(415);
    expect(res.body).toMatchObject({code: 'unsupported_type'});
    expect(await files()).toEqual([]);
    expect(repo.rows).toEqual([]);
  });

  it('rejects over-quota uploads before anything is stored', async () => {
    repo.usageOverride = {count: 20, uploadsLast24h: 1};
    const res = await request(app).post('/upload').attach('file', await jpegWithExif(100, 100), 'a.jpg');
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({code: 'quota_exceeded'});
    expect(await files()).toEqual([]);
    expect(repo.rows).toEqual([]);
  });

  it('allows 30 uploads a day and no more', async () => {
    repo.usageOverride = {count: 1, uploadsLast24h: 30};
    const res = await request(app).post('/upload').attach('file', await jpegWithExif(100, 100), 'a.jpg');
    expect(res.status).toBe(429);
    expect(res.body).toMatchObject({code: 'daily_upload_limit'});
    expect(await files()).toEqual([]);
  });

  it('stops a file larger than the plan allows and keeps nothing', async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(6 * 1024 * 1024, 7)]);
    const res = await request(app).post('/upload').attach('file', png, 'big.png');
    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({code: 'file_too_large'});
    expect(await files()).toEqual([]);
    expect(repo.rows).toEqual([]);
  });

  it('keeps video and music for plans that include them, stored as-is', async () => {
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(40_000, 3)]);
    const denied = await request(app).post('/upload').attach('file', mp4, 'clip.mp4');
    expect(denied.status).toBe(403);
    expect(denied.body).toMatchObject({code: 'feature_not_in_plan'});

    repo.tiers = ['premium'];
    const ok = await request(app).post('/upload').attach('file', mp4, 'clip.mp4');
    expect(ok.status).toBe(201);
    expect(ok.body).toMatchObject({kind: 'video', status: 'ready', sizeBytes: mp4.length, variants: []});
    const [stored] = await files();
    expect((await readFile(stored as string)).equals(mp4)).toBe(true);
  });

  it('marks a corrupt image rejected and removes whatever was written', async () => {
    const corrupt = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(5000, 9)]);
    const res = await request(app).post('/upload').attach('file', corrupt, 'broken.jpg');
    expect(res.status).toBe(422);
    expect(repo.rows).toHaveLength(1);
    expect(repo.rows[0]).toMatchObject({status: 'rejected', reason: 'processing_failed'});
    expect(await files()).toEqual([]);
  });

  it('requires a file and multipart', async () => {
    expect((await request(app).post('/upload').field('invitationId', OWN_INVITATION)).status).toBe(400);
    expect((await request(app).post('/upload').send({a: 1})).status).toBe(415);
  });

  it("refuses to attach to someone else's invitation", async () => {
    const res = await request(app).post('/upload').field('invitationId', '44444444-4444-4444-8444-444444444444').attach('file', await jpegWithExif(100, 100), 'a.jpg');
    expect(res.status).toBe(404);
    expect(repo.rows).toEqual([]);
  });

  it('lists only the caller\'s media with usage, and hides others (404 on delete)', async () => {
    const res = await request(app).post('/upload').attach('file', await jpegWithExif(100, 100), 'a.jpg');
    const id = res.body.id as string;
    const mine = await service.list(OWNER);
    expect(mine.items).toHaveLength(1);
    expect(mine.usage).toMatchObject({count: 1, maxCount: 20, tier: 'save-the-date'});
    expect((await service.list(OTHER)).items).toEqual([]);
    await expect(service.remove(OTHER, id)).rejects.toMatchObject({status: 404});
    expect(repo.rows).toHaveLength(1);
  });

  it('deletes unused media (files and row) and refuses media an invitation uses', async () => {
    const res = await request(app).post('/upload').attach('file', await jpegWithExif(100, 100), 'a.jpg');
    const id = res.body.id as string;
    repo.referenced = true;
    await expect(service.remove(OWNER, id)).rejects.toMatchObject({status: 409});
    expect((await files()).length).toBeGreaterThan(0);
    repo.referenced = false;
    await service.remove(OWNER, id);
    expect(repo.rows).toEqual([]);
    expect(await files()).toEqual([]);
  });
});
