import { createBundledHighlighter, createSingletonShorthands } from '@shikijs/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import type { HighlightLanguage } from './snippet';

const createHighlighter = createBundledHighlighter({
  engine: () => createJavaScriptRegexEngine(),
  themes: {
    'vitesse-dark': () => import('@shikijs/themes/vitesse-dark')
  },
  langs: {
    bash: () => import('@shikijs/langs/bash'),
    css: () => import('@shikijs/langs/css'),
    go: () => import('@shikijs/langs/go'),
    html: () => import('@shikijs/langs/html'),
    javascript: () => import('@shikijs/langs/javascript'),
    json: () => import('@shikijs/langs/json'),
    jsx: () => import('@shikijs/langs/jsx'),
    markdown: () => import('@shikijs/langs/markdown'),
    python: () => import('@shikijs/langs/python'),
    ruby: () => import('@shikijs/langs/ruby'),
    rust: () => import('@shikijs/langs/rust'),
    sql: () => import('@shikijs/langs/sql'),
    svelte: () => import('@shikijs/langs/svelte'),
    tsx: () => import('@shikijs/langs/tsx'),
    typescript: () => import('@shikijs/langs/typescript'),
    yaml: () => import('@shikijs/langs/yaml')
  }
});

const { codeToHtml } = createSingletonShorthands(createHighlighter);

export function highlightWithShiki(code: string, language: HighlightLanguage) {
  return codeToHtml(code, { lang: language, theme: 'vitesse-dark' });
}
