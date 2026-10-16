import { getCollection, type CollectionEntry } from 'astro:content';
import { sections } from './doc-sections';

export type Doc = CollectionEntry<'docs'>;

export const docHref = (doc: Doc) => `/docs/${doc.id}`;

export const sectionName = (id: string) => sections.find((section) => section.id === id)!.name;

// Every section with its pages in order; sections without pages are left out.
export const docsBySection = async () => {
  const docs = await getCollection('docs');
  return sections
    .map((section) => ({
      ...section,
      docs: docs.filter((doc) => doc.data.section === section.id).sort((a, b) => a.data.order - b.data.order),
    }))
    .filter((section) => section.docs.length > 0);
};
