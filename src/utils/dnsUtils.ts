/**
 * DNS and network utilities for handling ModelScope connectivity issues
 */

/**
 * Test if a domain can be resolved by making a simple HEAD request
 * This helps detect DNS resolution issues before attempting large downloads
 */
export async function testDomainConnectivity(
  url: string,
  timeout: number = 5000,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 405; // 405 Method Not Allowed is also OK
  } catch (error) {
    console.warn('Domain connectivity test failed:', url, error);
    return false;
  }
}

/**
 * Get alternative download URL by replacing domain
 * This can be used as a fallback if primary domain fails
 */
export function getAlternativeDownloadUrl(
  url: string,
  alternativeDomain: string,
): string {
  try {
    const urlObj = new URL(url);
    urlObj.hostname = alternativeDomain;
    return urlObj.toString();
  } catch (error) {
    console.error('Failed to create alternative URL:', error);
    return url;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Check if URL is a ModelScope URL
 */
export function isModelScopeUrl(url: string): boolean {
  const domain = extractDomain(url);
  return domain.includes('modelscope.cn');
}

/**
 * Pre-warm DNS by making a lightweight request
 * This can help Android resolve DNS before the actual download
 */
export async function preWarmDNS(url: string): Promise<void> {
  try {
    const domain = extractDomain(url);
    if (!domain) return;

    // Try to resolve DNS by making a HEAD request to the domain root
    const baseUrl = `https://${domain}`;
    await testDomainConnectivity(baseUrl, 3000);
    console.log('DNS pre-warmed for:', domain);
  } catch (error) {
    console.warn('DNS pre-warm failed:', error);
    // Don't throw, this is just a best-effort optimization
  }
}

