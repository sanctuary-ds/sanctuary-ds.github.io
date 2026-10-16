import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
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

export const collections = { docs };
