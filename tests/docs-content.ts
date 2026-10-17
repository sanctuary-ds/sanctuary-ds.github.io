import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// The documentation pages as the tests see them: read straight from the
// Markdown and MDX files, so a test never trusts the code that builds the pages.

const ROOT = 'src/content/docs';

export interface DocFile {
  path: string;
  title: string;
  description: string;
  section: string;
  order: number;
}

// Reads the simple `key: value` lines of a page's front matter. It accepts CRLF
// line endings and blank lines, and unquotes values quoted for YAML.
const frontMatter = (file: string, text: string) => {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) throw new Error(`${file} has no front matter.`);
  return Object.fromEntries(
    block[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^(\w+):\s*(.*?)\s*$/))
      .filter((match) => match !== null)
      .map(([, key, value]) => [key, value.replace(/^"(.*)"$/, '$1')]),
  );
};

export const docFiles: DocFile[] = readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => {
    const data = frontMatter(file, readFileSync(join(ROOT, file), 'utf8'));
    return {
      path: `/docs/${relative('.', file).replace(/\.mdx?$/, '')}`,
      title: data.title,
      description: data.description,
      section: data.section,
      order: Number(data.order),
    };
  });
