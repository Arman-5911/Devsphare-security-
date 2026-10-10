import { CrawlSummary } from '@devsphere/shared';
export interface CrawlerOptions {
    rootUrl: string;
    maxPages?: number;
    timeoutPerRequestMs?: number;
    allowPrivate?: boolean;
}
export declare function crawlWebsite(options: CrawlerOptions): Promise<CrawlSummary>;
