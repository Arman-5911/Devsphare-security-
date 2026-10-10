import { CookieAnalysisItem } from '@devsphere/shared';

export function analyzeCookies(setCookieHeaders: string[]): CookieAnalysisItem[] {
  const results: CookieAnalysisItem[] = [];

  for (const cookieStr of setCookieHeaders) {
    if (!cookieStr || typeof cookieStr !== 'string') continue;

    const parts = cookieStr.split(';').map((p) => p.trim());
    if (parts.length === 0) continue;

    const nameValue = parts[0].split('=');
    const name = nameValue[0].trim();
    if (!name) continue;

    let secure = false;
    let httpOnly = false;
    let sameSite: 'Strict' | 'Lax' | 'None' | 'Unset' = 'Unset';
    let path: string | undefined;
    let domain: string | undefined;

    for (let i = 1; i < parts.length; i++) {
      const attr = parts[i];
      const lowerAttr = attr.toLowerCase();

      if (lowerAttr === 'secure') {
        secure = true;
      } else if (lowerAttr === 'httponly') {
        httpOnly = true;
      } else if (lowerAttr.startsWith('samesite=')) {
        const val = attr.split('=')[1]?.trim().toLowerCase();
        if (val === 'strict') sameSite = 'Strict';
        else if (val === 'lax') sameSite = 'Lax';
        else if (val === 'none') sameSite = 'None';
      } else if (lowerAttr.startsWith('path=')) {
        path = attr.split('=')[1]?.trim();
      } else if (lowerAttr.startsWith('domain=')) {
        domain = attr.split('=')[1]?.trim();
      }
    }

    const hasSecurePrefix = name.startsWith('__Secure-');
    const hasHostPrefix = name.startsWith('__Host-');
    const issues: string[] = [];

    if (!secure) {
      issues.push('Missing "Secure" attribute; cookie may be transmitted over unencrypted HTTP.');
    }
    if (!httpOnly) {
      issues.push('Missing "HttpOnly" attribute; cookie is accessible to client JavaScript and vulnerable to XSS theft.');
    }
    if (sameSite === 'Unset') {
      issues.push('Missing "SameSite" attribute; vulnerable to Cross-Site Request Forgery (CSRF).');
    } else if (sameSite === 'None' && !secure) {
      issues.push('SameSite=None must be paired with Secure attribute.');
    }

    if (hasSecurePrefix && !secure) {
      issues.push('Cookie has __Secure- prefix but is missing the Secure flag.');
    }

    if (hasHostPrefix) {
      if (!secure) issues.push('Cookie has __Host- prefix but lacks Secure flag.');
      if (domain) issues.push('Cookie has __Host- prefix but specifies a Domain attribute.');
      if (path !== '/') issues.push('Cookie has __Host- prefix but does not have Path=/');
    }

    results.push({
      name,
      domain,
      path,
      secure,
      httpOnly,
      sameSite,
      hasSecurePrefix,
      hasHostPrefix,
      issues,
    });
  }

  return results;
}
