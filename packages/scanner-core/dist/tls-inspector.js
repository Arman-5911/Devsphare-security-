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
exports.inspectTls = inspectTls;
const tls = __importStar(require("tls"));
async function inspectTls(options) {
    const { hostname, port = 443, timeoutMs = 8000 } = options;
    return new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                socket.destroy();
                resolve(null);
            }
        }, timeoutMs);
        const socket = tls.connect({
            host: hostname,
            port,
            servername: hostname, // SNI is vital for modern CDNs and vhosts
            rejectUnauthorized: false, // We inspect the cert ourselves to capture self-signed or invalid certs
            timeout: timeoutMs,
        }, () => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            try {
                const peerCert = socket.getPeerCertificate(true);
                const protocol = socket.getProtocol() || 'Unknown';
                const cipher = socket.getCipher();
                const authorized = socket.authorized;
                const authorizationError = socket.authorizationError
                    ? String(socket.authorizationError)
                    : undefined;
                socket.end();
                if (!peerCert || !peerCert.valid_to) {
                    resolve(null);
                    return;
                }
                const validFrom = new Date(peerCert.valid_from).toISOString();
                const validTo = new Date(peerCert.valid_to).toISOString();
                const nowMs = Date.now();
                const validToMs = new Date(peerCert.valid_to).getTime();
                const daysRemaining = Math.floor((validToMs - nowMs) / (1000 * 60 * 60 * 24));
                const isExpired = daysRemaining < 0;
                const expiresSoon = daysRemaining >= 0 && daysRemaining < 30;
                // Parse SANs
                let san = [];
                if (peerCert.subjectaltname) {
                    san = peerCert.subjectaltname
                        .split(',')
                        .map((s) => s.trim().replace(/^DNS:/i, ''))
                        .filter(Boolean);
                }
                // Check if self-signed
                const isSelfSigned = peerCert.issuer &&
                    peerCert.subject &&
                    peerCert.issuer.CN === peerCert.subject.CN &&
                    (!peerCert.issuerCertificate || peerCert.issuerCertificate === peerCert);
                const toStr = (v) => Array.isArray(v) ? v.join(', ') : v;
                const result = {
                    subject: {
                        commonName: toStr(peerCert.subject?.CN),
                        organization: toStr(peerCert.subject?.O),
                        country: toStr(peerCert.subject?.C),
                    },
                    issuer: {
                        commonName: toStr(peerCert.issuer?.CN),
                        organization: toStr(peerCert.issuer?.O),
                        country: toStr(peerCert.issuer?.C),
                    },
                    validFrom,
                    validTo,
                    daysRemaining,
                    isExpired,
                    expiresSoon,
                    protocol,
                    cipherSuite: cipher ? cipher.name : 'Unknown',
                    san,
                    isSelfSigned: Boolean(isSelfSigned),
                    authorized,
                    authorizationError,
                };
                resolve(result);
            }
            catch {
                resolve(null);
            }
        });
        socket.on('error', () => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                socket.destroy();
                resolve(null);
            }
        });
        socket.on('timeout', () => {
            if (!settled) {
                settled = true;
                clearTimeout(timer);
                socket.destroy();
                resolve(null);
            }
        });
    });
}
