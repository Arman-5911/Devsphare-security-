import * as dns from 'dns';
import { DnsRecordInfo } from '@devsphere/shared';

try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers[0] === '127.0.0.1') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {}

export async function inspectDns(hostname: string): Promise<DnsRecordInfo> {
  const result: DnsRecordInfo = {
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
  } catch {}

  // 2. Resolve AAAA records
  try {
    result.ipv6 = await dns.promises.resolve6(hostname);
  } catch {}

  // 3. Resolve CNAME
  try {
    result.cnames = await dns.promises.resolveCname(hostname);
  } catch {}

  // 4. Resolve MX
  try {
    const mx = await dns.promises.resolveMx(domain);
    result.mxRecords = mx.map((m) => ({ exchange: m.exchange, priority: m.priority }));
  } catch {}

  // 5. Resolve NS
  try {
    result.nameservers = await dns.promises.resolveNs(domain);
  } catch {}

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
  } catch {}

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
  } catch {}

  return result;
}
