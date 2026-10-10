import { RedirectAnalysis } from '@devsphere/shared';
export interface HttpResponse {
    statusCode: number;
    headers: Record<string, string>;
    rawHeaders: string[];
    body: string;
    finalUrl: string;
    redirects: RedirectAnalysis;
    setCookieHeaders: string[];
}
export interface HttpRequestOptions {
    url: string;
    method?: string;
    maxRedirects?: number;
    timeoutMs?: number;
    maxBodyBytes?: number;
    allowPrivate?: boolean;
}
export declare function safeFetch(options: HttpRequestOptions): Promise<HttpResponse>;
