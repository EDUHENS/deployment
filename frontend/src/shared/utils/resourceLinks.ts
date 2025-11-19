'use client';

export interface ParsedResourceLink {
  title: string;
  href?: string;
  displayUrl?: string;
}

/**
 * Parse a resource string like "React Docs: https://react.dev" into a structured object.
 * Falls back gracefully when no explicit URL is present.
 */
export function parseResourceLink(raw: string): ParsedResourceLink | null {
  const text = (raw || '').trim();
  if (!text) return null;

  const httpMatch = text.match(/https?:\/\/\S+/i);
  if (httpMatch) {
    const urlText = httpMatch[0].trim();
    const href = urlText;
    const title = text
      .slice(0, httpMatch.index)
      .replace(/[-:–]\s*$/, '')
      .trim();
    return {
      title: title || urlText,
      href,
      displayUrl: urlText,
    };
  }

  const parts = text.split(/:/);
  if (parts.length > 1) {
    const title = parts[0]?.trim() || 'Resource';
    const urlText = parts.slice(1).join(':').trim();
    if (urlText) {
      const href = /^https?:\/\//i.test(urlText) ? urlText : `https://${urlText}`;
      return {
        title,
        href,
        displayUrl: urlText,
      };
    }
    return { title };
  }

  return {
    title: text,
  };
}


