import * as fs from 'fs';
import * as path from 'path';
import { ScanResult, ScanSummaryItem, ScanFilterInput } from '@devsphere/shared';

export class ScanStore {
  private scans: Map<string, ScanResult> = new Map();
  private storageFile: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    this.storageFile = path.join(dataDir, 'scans.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const items: ScanResult[] = JSON.parse(raw);
        for (const scan of items) {
          this.scans.set(scan.id, scan);
        }
      }
    } catch (err) {
      console.error('Failed to load persisted scans:', err);
    }
  }

  private saveToDisk(): void {
    try {
      const items = Array.from(this.scans.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist scans to disk:', err);
    }
  }

  public save(scan: ScanResult): void {
    this.scans.set(scan.id, scan);
    this.saveToDisk();
  }

  public getById(id: string): ScanResult | undefined {
    return this.scans.get(id);
  }

  public update(id: string, updates: Partial<ScanResult>): ScanResult | undefined {
    const existing = this.scans.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.scans.set(id, updated);
    this.saveToDisk();
    return updated;
  }

  public delete(id: string): boolean {
    const deleted = this.scans.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  public deleteMany(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.scans.delete(id)) {
        count++;
      }
    }
    if (count > 0) {
      this.saveToDisk();
    }
    return count;
  }

  public clear(): void {
    this.scans.clear();
    this.saveToDisk();
  }


  public list(filters: ScanFilterInput): {
    items: ScanSummaryItem[];
    total: number;
    limit: number;
    offset: number;
  } {
    let all = Array.from(this.scans.values());

    // Search query filter
    if (filters.query) {
      const q = filters.query.toLowerCase();
      all = all.filter(
        (s) =>
          s.targetUrl.toLowerCase().includes(q) ||
          s.targetHostname.toLowerCase().includes(q)
      );
    }

    // Mode filter
    if (filters.mode) {
      all = all.filter((s) => s.mode === filters.mode);
    }

    // Status filter
    if (filters.status) {
      all = all.filter((s) => s.status === filters.status);
    }

    // Grade filter
    if (filters.grade) {
      all = all.filter((s) => s.score?.letterGrade === filters.grade);
    }

    // Sort
    all.sort((a, b) => {
      if (filters.sortBy === 'overallScore') {
        const diff = (a.score?.overallScore || 0) - (b.score?.overallScore || 0);
        return filters.sortOrder === 'asc' ? diff : -diff;
      } else {
        const timeA = new Date(a.startedAt).getTime();
        const timeB = new Date(b.startedAt).getTime();
        return filters.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });

    const total = all.length;
    const paginated = all.slice(filters.offset, filters.offset + filters.limit);

    const summaries: ScanSummaryItem[] = paginated.map((s) => ({
      id: s.id,
      mode: s.mode || 'public',
      targetUrl: s.targetUrl,
      targetHostname: s.targetHostname,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      durationMs: s.durationMs,
      overallScore: s.multiPillar?.overallHealth ?? s.score?.overallScore ?? 0,
      letterGrade: s.multiPillar?.grade ?? s.score?.letterGrade ?? 'F',
      multiPillar: s.multiPillar?.radar,
      findingsCount: s.score?.findingsBySeverity ?? {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
    }));

    return {
      items: summaries,
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  public count(): number {
    return this.scans.size;
  }
}

export const scanStore = new ScanStore();
