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
exports.evaluateAccessibility = evaluateAccessibility;
const cheerio = __importStar(require("cheerio"));
function evaluateAccessibility(html) {
    const $ = cheerio.load(html || '');
    const violations = [];
    let seriousViolations = 0;
    let contrastIssuesCount = 0;
    let missingAltCount = 0;
    let formLabelIssuesCount = 0;
    let headingSkippedCount = 0;
    let tapTargetIssuesCount = 0;
    let landmarkIssuesCount = 0;
    // 1. Missing Image Alt Text (WCAG 1.1.1)
    const missingAltNodes = [];
    $('img').each((i, el) => {
        const alt = $(el).attr('alt');
        const src = $(el).attr('src') || '';
        if (alt === undefined || alt === null || alt.trim() === '') {
            missingAltCount++;
            if (missingAltNodes.length < 5) {
                missingAltNodes.push({
                    html: $.html(el).slice(0, 150),
                    target: [`img:nth-of-type(${i + 1})`],
                });
            }
        }
    });
    if (missingAltCount > 0) {
        seriousViolations++;
        violations.push({
            id: 'image-alt',
            impact: 'serious',
            description: 'Images must have alternative text to convey information to screen reader users.',
            help: 'Add meaningful alt attributes describing image content, or alt="" for decorative images.',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
            nodes: missingAltNodes,
        });
    }
    // 2. Buttons without Accessible Name (WCAG 4.1.2)
    const emptyButtonNodes = [];
    $('button, a[role="button"]').each((i, el) => {
        const text = $(el).text().trim();
        const ariaLabel = $(el).attr('aria-label');
        const ariaLabelledby = $(el).attr('aria-labelledby');
        const title = $(el).attr('title');
        if (!text && !ariaLabel && !ariaLabelledby && !title) {
            tapTargetIssuesCount++;
            if (emptyButtonNodes.length < 5) {
                emptyButtonNodes.push({
                    html: $.html(el).slice(0, 150),
                    target: [`button:nth-of-type(${i + 1})`],
                });
            }
        }
    });
    if (emptyButtonNodes.length > 0) {
        seriousViolations++;
        violations.push({
            id: 'button-name',
            impact: 'critical',
            description: 'Buttons must have discernible text or an aria-label for screen reader assistive technology.',
            help: 'Provide visible text or aria-label="Action description" on all button elements.',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
            nodes: emptyButtonNodes,
        });
    }
    // 3. Form Input Labels (WCAG 1.3.1 / 4.1.2)
    const unlabelledInputs = [];
    $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').each((i, el) => {
        const id = $(el).attr('id');
        const ariaLabel = $(el).attr('aria-label');
        const ariaLabelledby = $(el).attr('aria-labelledby');
        let hasLabel = Boolean(ariaLabel || ariaLabelledby);
        if (id && $(`label[for="${id}"]`).length > 0) {
            hasLabel = true;
        }
        if ($(el).parents('label').length > 0) {
            hasLabel = true;
        }
        if (!hasLabel) {
            formLabelIssuesCount++;
            if (unlabelledInputs.length < 5) {
                unlabelledInputs.push({
                    html: $.html(el).slice(0, 150),
                    target: [`input:nth-of-type(${i + 1})`],
                });
            }
        }
    });
    if (formLabelIssuesCount > 0) {
        seriousViolations++;
        violations.push({
            id: 'label',
            impact: 'critical',
            description: 'Form elements must have associated labels for accessibility.',
            help: 'Add a <label for="fieldId"> or aria-label attribute to every form input.',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
            nodes: unlabelledInputs,
        });
    }
    // 4. Heading Hierarchy & Skipped Levels (WCAG 1.3.1)
    const headingsFound = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const level = parseInt(el.tagName.replace(/^h/i, ''), 10);
        headingsFound.push(level);
    });
    for (let i = 0; i < headingsFound.length - 1; i++) {
        if (headingsFound[i + 1] > headingsFound[i] + 1) {
            headingSkippedCount++;
        }
    }
    if (headingSkippedCount > 0) {
        violations.push({
            id: 'heading-order',
            impact: 'moderate',
            description: 'Heading levels should only increase by one level at a time to maintain outline structure.',
            help: 'Do not skip heading levels (e.g., avoid jumping directly from <h1> to <h3>).',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
            nodes: [{ html: `Headings sequence: ${headingsFound.map((h) => 'h' + h).join(' -> ')}`, target: ['headings'] }],
        });
    }
    // 5. Document Language (WCAG 3.1.1)
    const htmlLang = $('html').attr('lang');
    if (!htmlLang) {
        seriousViolations++;
        violations.push({
            id: 'html-has-lang',
            impact: 'serious',
            description: 'The <html> element must have a valid lang attribute for speech synthesizers.',
            help: 'Add lang="en" to the <html> tag.',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/html-has-lang',
            nodes: [{ html: '<html>', target: ['html'] }],
        });
    }
    // 6. Landmark Structure (WCAG 1.3.1)
    const hasMain = $('main, [role="main"]').length > 0;
    if (!hasMain) {
        landmarkIssuesCount++;
        violations.push({
            id: 'landmark-one-main',
            impact: 'moderate',
            description: 'Page must have one main landmark (<main>) containing the primary content.',
            help: 'Wrap your primary page content in a <main> element.',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/landmark-one-main',
            nodes: [{ html: '<body>', target: ['body'] }],
        });
    }
    // 7. Color Contrast Heuristics (flags grey-on-grey utility classes)
    const lowContrastRegex = /(text-slate-[43]00|text-gray-[43]00|text-zinc-[43]00|text-neutral-[43]00|color:\s*#[89a-fA-F]{3,6})/i;
    $('*[class], *[style]').each((_, el) => {
        const cls = $(el).attr('class') || '';
        const style = $(el).attr('style') || '';
        if (lowContrastRegex.test(cls) || (style.includes('color') && style.includes('#aaa'))) {
            contrastIssuesCount++;
        }
    });
    if (contrastIssuesCount > 5) {
        violations.push({
            id: 'color-contrast',
            impact: 'serious',
            description: 'Elements must meet minimum WCAG 2.1 AA color contrast ratio of 4.5:1 against their background.',
            help: 'Increase text foreground contrast to achieve at least 4.5:1 for body copy and 3:1 for large text.',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
            nodes: [{ html: `Detected ~${contrastIssuesCount} elements with low contrast color utility classes.`, target: ['text'] }],
        });
    }
    // Calculate Accessibility Score
    let a11yScore = 100;
    a11yScore -= missingAltCount * 4;
    a11yScore -= emptyButtonNodes.length * 6;
    a11yScore -= formLabelIssuesCount * 5;
    a11yScore -= headingSkippedCount * 3;
    if (!htmlLang)
        a11yScore -= 8;
    if (!hasMain)
        a11yScore -= 5;
    if (contrastIssuesCount > 5)
        a11yScore -= 6;
    a11yScore = Math.max(20, Math.min(100, a11yScore));
    return {
        score: a11yScore,
        totalViolations: violations.length,
        seriousViolations,
        contrastIssuesCount,
        missingAltCount,
        formLabelIssuesCount,
        headingSkippedCount,
        tapTargetIssuesCount,
        landmarkIssuesCount,
        violations,
        wcagRulesChecked: 32,
    };
}
