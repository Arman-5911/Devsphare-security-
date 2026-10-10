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
exports.CyberLabV3Store = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CyberLabV3Store {
    runs = new Map();
    storageFile;
    constructor() {
        const dataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            try {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            catch { }
        }
        this.storageFile = path.join(dataDir, 'cyberlab-v3-runs.json');
        this.loadFromDisk();
    }
    loadFromDisk() {
        try {
            if (fs.existsSync(this.storageFile)) {
                const raw = fs.readFileSync(this.storageFile, 'utf8');
                const items = JSON.parse(raw);
                for (const run of items) {
                    this.runs.set(run.id, run);
                }
            }
        }
        catch (err) {
            console.error('Failed to load persisted CyberLab V3 runs:', err);
        }
    }
    saveToDisk() {
        try {
            const items = Array.from(this.runs.values());
            fs.writeFileSync(this.storageFile, JSON.stringify(items, null, 2), 'utf8');
        }
        catch (err) {
            console.error('Failed to persist CyberLab V3 runs to disk:', err);
        }
    }
    save(run) {
        this.runs.set(run.id, run);
        this.saveToDisk();
    }
    getById(id) {
        return this.runs.get(id);
    }
    listAll() {
        return Array.from(this.runs.values()).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }
    update(id, updates) {
        const existing = this.runs.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...updates };
        this.runs.set(id, updated);
        this.saveToDisk();
        return updated;
    }
    delete(id) {
        const deleted = this.runs.delete(id);
        if (deleted) {
            this.saveToDisk();
        }
        return deleted;
    }
}
exports.CyberLabV3Store = CyberLabV3Store;
