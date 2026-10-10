import { SecurityTxtResult } from '@devsphere/shared';
/**
 * RFC 9116 security.txt parser and validator
 */
export declare function auditSecurityTxt(rootUrl: string): Promise<SecurityTxtResult>;
