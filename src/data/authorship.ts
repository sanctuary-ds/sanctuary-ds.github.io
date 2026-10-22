// Who made Sanctuary, in one place. The footer credit and the schema.org JSON-LD
// in Base.astro both read from here, so the name a visitor sees and the one
// search engines read can never drift apart.

export const author = {
  name: 'Anthony Portugal',
  // The author's own website, which the footer credit links to.
  url: 'https://anthonyportugal.github.io',
  // Every profile that is the same person: search engines and AI agents use
  // these to tell this author apart from anyone else with the same name.
  sameAs: ['https://anthonyportugal.github.io', 'https://github.com/anthonyportugal'],
};

// One graph for the whole site: the person is described once under an @id, and
// the website and the design system point to it rather than repeating it.
export function structuredData(site: URL) {
  const home = new URL('/', site).href;
  const person = { '@id': `${home}#author` };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Person', ...person, name: author.name, url: author.url, sameAs: author.sameAs },
      { '@type': 'WebSite', '@id': `${home}#website`, name: 'Sanctuary', url: home, author: person, publisher: person },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${home}#design-system`,
        name: 'Sanctuary',
        description: 'A design system of stone, glass and light.',
        url: home,
        codeRepository: 'https://github.com/sanctuary-ds/tokens',
        license: 'https://opensource.org/licenses/MIT',
        author: person,
        creator: person,
      },
    ],
  };
}
