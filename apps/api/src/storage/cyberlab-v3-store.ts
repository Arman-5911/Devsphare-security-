import * as fs from 'fs';
import * as path from 'path';
import { CyberLabV3Run } from '@devsphere/shared';

export class CyberLabV3Store {
  private runs: Map<string, CyberLabV3Run> = new Map();
  private storageFile: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.storageFile = path.join(dataDir, 'cyberlab-v3-runs.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const items: CyberLabV3Run[] = JSON.parse(raw);
        for (const run of items) {
          this.runs.set(run.id, run);
        }
      }
    } catch (err) {
      console.error('Failed to load persisted CyberLab V3 runs:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const items = Array.from(this.runs.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist CyberLab V3 runs to disk:', err);
    }
  }

  public save(run: CyberLabV3Run): void {
    this.runs.set(run.id, run);
    this.saveToDisk();
  }

  public getById(id: string): CyberLabV3Run | undefined {
    return this.runs.get(id);
  }

  public listAll(): CyberLabV3Run[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  public update(id: string, updates: Partial<CyberLabV3Run>): CyberLabV3Run | undefined {
    const existing = this.runs.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.runs.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  public delete(id: string): boolean {
    const deleted = this.runs.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }
}
