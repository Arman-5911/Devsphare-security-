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
exports.inspectDns = inspectDns;
const dns = __importStar(require("dns"));
try {
    const currentServers = dns.getServers();
    if (!currentServers || currentServers.length === 0 || currentServers[0] === '127.0.0.1') {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
}
catch { }
async function inspectDns(hostname) {
    const result = {
        ipv4: [],
        ipv6: [],
        cnames: [],
        mxRecords: [],
        txtRecords: [],
        hasSpf: false,
        hasDmarc: false,
        nameservers: [],
    };
    const domain = hostname.replace(/^www\./i, '');
    // 1. Resolve A records
    try {
        result.ipv4 = await dns.promises.resolve4(hostname);
    }
    catch { }
    // 2. Resolve AAAA records
    try {
        result.ipv6 = await dns.promises.resolve6(hostname);
    }
    catch { }
    // 3. Resolve CNAME
    try {
        result.cnames = await dns.promises.resolveCname(hostname);
    }
    catch { }
    // 4. Resolve MX
    try {
        const mx = await dns.promises.resolveMx(domain);
        result.mxRecords = mx.map((m) => ({ exchange: m.exchange, priority: m.priority }));
    }
    catch { }
    // 5. Resolve NS
    try {
        result.nameservers = await dns.promises.resolveNs(domain);
    }
    catch { }
    // 6. Resolve TXT (inspect SPF)
    try {
        const txt = await dns.promises.resolveTxt(domain);
        result.txtRecords = txt;
        for (const recordArray of txt) {
            const fullTxt = recordArray.join('');
            if (fullTxt.toLowerCase().startsWith('v=spf1')) {
                result.hasSpf = true;
                result.spfRecord = fullTxt;
                break;
            }
        }
    }
    catch { }
    // 7. Resolve DMARC on _dmarc.<domain>
    try {
        const dmarcHost = `_dmarc.${domain}`;
        const dmarcTxt = await dns.promises.resolveTxt(dmarcHost);
        for (const recordArray of dmarcTxt) {
            const fullTxt = recordArray.join('');
            if (fullTxt.toLowerCase().startsWith('v=dmarc1')) {
                result.hasDmarc = true;
                result.dmarcRecord = fullTxt;
                break;
            }
        }
    }
    catch { }
    return result;
}
