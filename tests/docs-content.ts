import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// The documentation pages as the tests see them: read straight from the
// Markdown files, so a test never trusts the code that builds the pages.

const ROOT = 'src/content/docs';

export interface DocFile {
  path: string;
  title: string;
  description: string;
  section: string;
  order: number;
}

const frontMatter = (text: string) =>
  Object.fromEntries(
    text
      .match(/^---\n([\s\S]*?)\n---/)![1]
      .split('\n')
      .map((line) => line.match(/^(\w+):\s*(.*)$/)!.slice(1)),
  );

export const docFiles: DocFile[] = readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const data = frontMatter(readFileSync(join(ROOT, file), 'utf8'));
    return {
      path: `/docs/${relative('.', file).replace(/\.md$/, '')}`,
      title: data.title,
      description: data.description,
      section: data.section,
      order: Number(data.order),
    };
  });
