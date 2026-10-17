// The sections of the documentation, in the order the index lists them. A page
// names its section in its front matter. Kept apart from docs.ts so the
// collection config can read it without importing the collection itself.
export const sections = [
  { id: 'start', name: 'Start' },
  { id: 'foundations', name: 'Foundations' },
  { id: 'reference', name: 'Reference' },
  { id: 'guides', name: 'Guides' },
] as const;

export const sectionIds = sections.map(({ id }) => id) as [string, ...string[]];
