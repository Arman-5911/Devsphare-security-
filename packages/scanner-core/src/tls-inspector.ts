import * as tls from 'tls';
import { TlsCertificateInfo } from '@devsphere/shared';

export interface TlsInspectOptions {
  hostname: string;
  port?: number;
  timeoutMs?: number;
}

export async function inspectTls(
  options: TlsInspectOptions
): Promise<TlsCertificateInfo | null> {
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

    const socket = tls.connect(
      {
        host: hostname,
        port,
        servername: hostname, // SNI is vital for modern CDNs and vhosts
        rejectUnauthorized: false, // We inspect the cert ourselves to capture self-signed or invalid certs
        timeout: timeoutMs,
      },
      () => {
        if (settled) return;
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
          let san: string[] = [];
          if (peerCert.subjectaltname) {
            san = peerCert.subjectaltname
              .split(',')
              .map((s) => s.trim().replace(/^DNS:/i, ''))
              .filter(Boolean);
          }

          // Check if self-signed
          const isSelfSigned =
            peerCert.issuer &&
            peerCert.subject &&
            peerCert.issuer.CN === peerCert.subject.CN &&
            (!peerCert.issuerCertificate || peerCert.issuerCertificate === peerCert);

          const toStr = (v?: string | string[]) =>
            Array.isArray(v) ? v.join(', ') : v;

          const result: TlsCertificateInfo = {
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
        } catch {
          resolve(null);
        }
      }
    );

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
