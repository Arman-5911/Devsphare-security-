import { SeoDetails } from '@devsphere/shared';
export interface SeoEngineOptions {
    url: string;
    html: string;
    robotsTxtContent?: string;
}
export declare function evaluateSeoAndGeo(options: SeoEngineOptions): SeoDetails;
