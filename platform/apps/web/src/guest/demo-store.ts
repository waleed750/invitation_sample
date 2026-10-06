import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {GuestMessage, InvitationPublicStore, PublishedSnapshot, Rsvp} from './store';

const MAX_RSVPS = 2_000;
const MAX_MESSAGES = 500;

interface StoredInvitation {
  snapshot: PublishedSnapshot;
  rsvps: Rsvp[];
  messages: GuestMessage[];
}

interface StoreFile {
  invitations: Record<string, StoredInvitation>;
}

const emptyStore = (): StoreFile => ({invitations: {}});

export class DemoFileStore implements InvitationPublicStore {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath = process.env.DEMO_DATA_DIR
      ? path.join(process.env.DEMO_DATA_DIR, 'public.json')
      : path.join(process.cwd(), '.demo-data', 'public.json'),
  ) {}

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async read(): Promise<StoreFile> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as StoreFile;
      return parsed && typeof parsed === 'object' && parsed.invitations ? parsed : emptyStore();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyStore();
      throw error;
    }
  }

  private async write(data: StoreFile): Promise<void> {
    const directory = path.dirname(this.filePath);
    await mkdir(directory, {recursive: true});
    const temporary = path.join(directory, `.${path.basename(this.filePath)}.${process.pid}.${crypto.randomUUID()}.tmp`);
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temporary, this.filePath);
  }

  publish(snapshot: PublishedSnapshot): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.read();
      const current = data.invitations[snapshot.shareSlug];
      data.invitations[snapshot.shareSlug] = {
        snapshot,
        rsvps: current?.rsvps ?? [],
        messages: current?.messages ?? [],
      };
      await this.write(data);
    });
  }

  getBySlug(shareSlug: string): Promise<PublishedSnapshot | null> {
    return this.enqueue(async () => (await this.read()).invitations[shareSlug]?.snapshot ?? null);
  }

  addRsvp(shareSlug: string, rsvp: Rsvp): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.read();
      const invitation = data.invitations[shareSlug];
      if (!invitation) throw new RangeError('invitation_not_found');
      if (invitation.rsvps.length >= MAX_RSVPS) throw new RangeError('rsvp_store_limit');
      invitation.rsvps.push(rsvp);
      await this.write(data);
    });
  }

  listRsvps(shareSlug: string): Promise<Rsvp[]> {
    return this.enqueue(async () => structuredClone((await this.read()).invitations[shareSlug]?.rsvps ?? []));
  }

  addMessage(shareSlug: string, message: GuestMessage): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.read();
      const invitation = data.invitations[shareSlug];
      if (!invitation) throw new RangeError('invitation_not_found');
      if (invitation.messages.length >= MAX_MESSAGES) throw new RangeError('message_store_limit');
      invitation.messages.push(message);
      await this.write(data);
    });
  }

  listMessages(shareSlug: string): Promise<GuestMessage[]> {
    return this.enqueue(async () => structuredClone((await this.read()).invitations[shareSlug]?.messages ?? []));
  }
}
