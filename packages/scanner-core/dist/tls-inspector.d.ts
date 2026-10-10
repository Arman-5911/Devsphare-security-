import { TlsCertificateInfo } from '@devsphere/shared';
export interface TlsInspectOptions {
    hostname: string;
    port?: number;
    timeoutMs?: number;
}
export declare function inspectTls(options: TlsInspectOptions): Promise<TlsCertificateInfo | null>;
