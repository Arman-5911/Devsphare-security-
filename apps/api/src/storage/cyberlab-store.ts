import * as fs from 'fs';
import * as path from 'path';
import { CyberLabSession } from '@devsphere/shared';

export class CyberLabStore {
  private sessions: Map<string, CyberLabSession> = new Map();
  private storageFile: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.storageFile = path.join(dataDir, 'cyberlab-sessions.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const items: CyberLabSession[] = JSON.parse(raw);
        for (const session of items) {
          this.sessions.set(session.id, session);
        }
      }
    } catch (err) {
      console.error('Failed to load persisted CyberLab sessions:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const items = Array.from(this.sessions.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist CyberLab sessions to disk:', err);
    }
  }

  public save(session: CyberLabSession): void {
    this.sessions.set(session.id, session);
    this.saveToDisk();
  }

  public getById(id: string): CyberLabSession | undefined {
    return this.sessions.get(id);
  }

  public listAll(): CyberLabSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public update(id: string, updates: Partial<CyberLabSession>): CyberLabSession | undefined {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.sessions.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  public delete(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  public deleteAll(): void {
    this.sessions.clear();
    this.saveToDisk();
  }
}
