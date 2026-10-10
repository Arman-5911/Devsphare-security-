"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanStore = exports.ScanStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ScanStore {
    scans = new Map();
    storageFile;
    constructor() {
        const dataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            try {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            catch { }
        }
        this.storageFile = path.join(dataDir, 'scans.json');
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs.existsSync(this.storageFile)) {
                const raw = fs.readFileSync(this.storageFile, 'utf8');
                const items = JSON.parse(raw);
                for (const scan of items) {
                    this.scans.set(scan.id, scan);
                }
            }
        }
        catch (err) {
            console.error('Failed to load persisted scans:', err);
        }
    }
    saveToDisk() {
        try {
            const items = Array.from(this.scans.values());
            fs.writeFileSync(this.storageFile, JSON.stringify(items, null, 2), 'utf8');
        }
        catch (err) {
            console.error('Failed to persist scans to disk:', err);
        }
    }
    save(scan) {
        this.scans.set(scan.id, scan);
        this.saveToDisk();
    }
    getById(id) {
        return this.scans.get(id);
    }
    update(id, updates) {
        const existing = this.scans.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...updates };
        this.scans.set(id, updated);
        this.saveToDisk();
        return updated;
    }
    delete(id) {
        const deleted = this.scans.delete(id);
        if (deleted) {
            this.saveToDisk();
        }
        return deleted;
    }
    deleteMany(ids) {
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
    clear() {
        this.scans.clear();
        this.saveToDisk();
    }
    list(filters) {
        let all = Array.from(this.scans.values());
        // Search query filter
        if (filters.query) {
            const q = filters.query.toLowerCase();
            all = all.filter((s) => s.targetUrl.toLowerCase().includes(q) ||
                s.targetHostname.toLowerCase().includes(q));
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
            }
            else {
                const timeA = new Date(a.startedAt).getTime();
                const timeB = new Date(b.startedAt).getTime();
                return filters.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
            }
        });
        const total = all.length;
        const paginated = all.slice(filters.offset, filters.offset + filters.limit);
        const summaries = paginated.map((s) => ({
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
    count() {
        return this.scans.size;
    }
}
exports.ScanStore = ScanStore;
exports.scanStore = new ScanStore();
