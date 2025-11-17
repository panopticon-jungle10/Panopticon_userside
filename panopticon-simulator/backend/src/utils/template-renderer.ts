export function renderTemplate(
  content: string,
  params: Record<string, string | undefined | null>,
): string {
  return Object.entries(params).reduce((acc, [key, value]) => {
    const safeValue = value ?? '';
    const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
    return acc.replace(pattern, safeValue);
  }, content);
}
