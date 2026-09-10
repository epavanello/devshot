const languageAliases: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml'
};

const webLanguageIds = [
  'bash', 'css', 'go', 'html', 'javascript', 'json', 'jsx', 'markdown', 'python',
  'ruby', 'rust', 'sql', 'svelte', 'tsx', 'typescript', 'yaml'
] as const;
const webLanguages = new Set<string>(webLanguageIds);
export type HighlightLanguage = (typeof webLanguageIds)[number];

export function normalizeLanguage(value?: string): HighlightLanguage | 'text' {
  const language = (value || 'text').trim().toLowerCase();
  const normalized = languageAliases[language] ?? language;
  return webLanguages.has(normalized) ? normalized as HighlightLanguage : 'text';
}

export async function highlightCode(code: string, language?: string): Promise<string> {
  const normalized = normalizeLanguage(language);
  if (normalized === 'text') return `<pre class="shiki vitesse-dark"><code>${escapeHtml(code)}</code></pre>`;
  const { highlightWithShiki } = await import('./highlighter');
  return highlightWithShiki(code, normalized);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]!);
}

export function terminalHtml(value: string): string {
  const withoutAnsi = value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
  return `<pre class="terminal"><code>${escapeHtml(withoutAnsi)}</code></pre>`;
}
