import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { sectionIds } from './data/doc-sections';

// The documentation pages: Markdown under src/content/docs, one file per page.
// The path is the URL (foundations/color.md is /docs/foundations/color), and
// the front matter places the page in the index.
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(sectionIds),
    /** Position inside its section, lowest first. */
    order: z.number(),
  }),
});

export const collections = { docs };
