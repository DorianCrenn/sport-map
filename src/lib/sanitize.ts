import DOMPurify from 'dompurify';

export function sanitizeText(str: unknown): string {
  if (typeof str !== 'string') return '';
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

export function sanitizeRich(html: unknown): string {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeFilename(str: unknown, { maxLen = 60 }: { maxLen?: number } = {}): string {
  if (typeof str !== 'string' || !str.trim()) return 'export';
  return (
    str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s\-_]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, maxLen)
  ) || 'export';
}
