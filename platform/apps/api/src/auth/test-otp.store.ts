export interface StoredOtp {
  code: string;
  email: string;
  createdAt: Date;
}

export class TestOtpStore {
  private codes = new Map<string, StoredOtp>();
  private lastEntry: StoredOtp | null = null;

  set(email: string, code: string): void {
    const normalized = email.toLowerCase().trim();
    const entry: StoredOtp = { code, email: normalized, createdAt: new Date() };
    this.codes.set(normalized, entry);
    this.lastEntry = entry;
  }

  get(email?: string): StoredOtp | null {
    if (email && email.trim() !== '') {
      return this.codes.get(email.toLowerCase().trim()) ?? null;
    }
    return this.lastEntry;
  }

  clear(): void {
    this.codes.clear();
    this.lastEntry = null;
  }
}

export const testOtpStore = new TestOtpStore();
