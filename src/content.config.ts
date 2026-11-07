import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { changelogUrl, coreVersion, parseChangelog } from './data/changelog';
import { sectionIds } from './data/doc-sections';

// The documentation pages: Markdown or MDX under src/content/docs, one file per
// page. MDX is for pages that generate part of their content from the core.
// The path is the URL (foundations/color.mdx is /docs/foundations/color), and
// the front matter places the page in the index.
const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(sectionIds),
    /** Position inside its section, lowest first. */
    order: z.number(),
  }),
});

// The core's changelog, one entry: downloaded at build time from the tag of the
// installed version and rendered with Astro's own Markdown pipeline. A failed
// download, or a changelog that does not open on the installed version, fails
// the build: the site never ships an empty or mismatched changelog.
const DOWNLOAD_TIMEOUT_MS = 30_000;
const changelog = defineCollection({
  loader: {
    name: 'core-changelog',
    load: async ({ store, renderMarkdown, logger }) => {
      const url = changelogUrl(coreVersion);
      let text: string;
      try {
        // A stalled connection fails the build too, instead of hanging it.
        const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        text = await response.text();
      } catch (error) {
        throw new Error(`Could not download the changelog of @sanctuary-ds/tokens ${coreVersion} from ${url}: ${error instanceof Error ? error.message : error}`);
      }
      const { note, releases } = parseChangelog(text);
      if (releases[0]?.version !== coreVersion) {
        throw new Error(`The changelog at ${url} opens on ${releases[0]?.version ?? 'no release'}, not on the installed ${coreVersion}.`);
      }
      const html = async (markdown: string) => (await renderMarkdown(markdown)).html;
      store.clear();
      store.set({
        id: 'core',
        data: {
          url,
          note: await html(note),
          releases: await Promise.all(
            releases.map(async ({ sections, ...release }) => ({
              ...release,
              sections: await Promise.all(sections.map(async ({ markdown, ...section }) => ({ ...section, html: await html(markdown) }))),
            })),
          ),
        },
      });
      logger.info(`Loaded the changelog of @sanctuary-ds/tokens ${coreVersion}: ${releases.length} releases.`);
    },
  },
  schema: z.object({
    /** Where the changelog was read from. */
    url: z.url(),
    note: z.string(),
    releases: z.array(
      z.object({
        version: z.string(),
        date: z.string(),
        compareUrl: z.url().optional(),
        sections: z.array(z.object({ title: z.string(), breaking: z.boolean(), html: z.string() })),
      }),
    ),
  }),
});

export const collections = { docs, changelog };
