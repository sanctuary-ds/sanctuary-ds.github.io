import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// The core's changelog. It is not published to npm (the package ships dist and
// tokens only): release-please writes it in the tokens repository, so the site
// reads it at build time from the tag of the installed version. The page then
// always matches the version the site documents.

const require = createRequire(import.meta.url);
const manifest: unknown = JSON.parse(readFileSync(require.resolve('@sanctuary-ds/tokens/package.json'), 'utf8'));
if (!(manifest && typeof manifest === 'object' && 'version' in manifest && typeof manifest.version === 'string')) {
  throw new Error('The installed @sanctuary-ds/tokens has no version in its package.json.');
}

/** The installed version of the core, the one this site documents. */
export const coreVersion = manifest.version;

/**
 * The range a CDN link should name to follow the installed version without
 * breaking: before 1.0.0 a breaking change raises the minor (0.3), after it the
 * major (1).
 */
export const cdnRange = (version: string) => {
  const [major, minor] = version.split('.');
  return major === '0' ? `0.${minor}` : major;
};

/** Where the changelog of a released version lives. */
export const changelogUrl = (version: string) => `https://raw.githubusercontent.com/sanctuary-ds/tokens/v${version}/CHANGELOG.md`;

export interface ReleaseSection {
  /** The section's title for the page: "Breaking changes", "Features", "Bug Fixes". */
  title: string;
  breaking: boolean;
  /** The section's entries, as Markdown. */
  markdown: string;
}

export interface Release {
  version: string;
  /** The release date, as written: YYYY-MM-DD. */
  date: string;
  /** The comparison with the previous release, when the heading links one. */
  compareUrl?: string;
  sections: ReleaseSection[];
}

// release-please writes "## [0.3.0](compare link) (2026-11-07)"; the releases
// before it have no link: "## 0.2.0 (2026-11-02)".
const RELEASE = /^## (?:\[(\d+\.\d+\.\d+)\]\((\S+)\)|(\d+\.\d+\.\d+)) \((\d{4}-\d{2}-\d{2})\)$/;
const SECTION = /^### (.+)$/;
const BREAKING = '⚠ BREAKING CHANGES';

// release-please writes custom property names bare (--san-breakpoint-<size>).
// Rendered as prose, smartypants would turn "--" into a dash and the Markdown
// parser would drop "<size>" as an unknown tag. A word that starts with "--" is
// code, so it is set as code; any other "<" is escaped, so no text can vanish.
const CODE_SPAN = /(`[^`\n]*`)/;
const outsideCode = (markdown: string, map: (text: string) => string) =>
  markdown
    .split(CODE_SPAN)
    .map((part, index) => (index % 2 ? part : map(part)))
    .join('');
export const keepNames = (markdown: string) =>
  outsideCode(
    outsideCode(markdown, (text) => text.replace(/(^|[\s(])(--[^\s,;)]*[^\s,;).])/g, '$1`$2`')),
    (text) => text.replace(/</g, '&lt;'),
  );

const parts = (version: string) => version.split('.').map(Number);
/** Newest first: compares release versions part by part. */
export const byVersionDescending = (a: Release, b: Release) => {
  const [x, y] = [parts(a.version), parts(b.version)];
  return y.map((part, index) => part - x[index]).find((difference) => difference !== 0) ?? 0;
};

/**
 * Splits a release-please changelog into its note (the text between the file's
 * own title and the first release) and its releases, newest first. A heading it
 * does not recognize fails the build instead of being dropped from the page.
 */
export const parseChangelog = (text: string): { note: string; releases: Release[] } => {
  const note: string[] = [];
  const releases: Release[] = [];
  let release: Release | undefined;
  let section: ReleaseSection | undefined;
  let lines: string[] = [];

  const closeSection = () => {
    if (section) section.markdown = keepNames(lines.join('\n').trim());
    else if (release && lines.join('').trim()) throw new Error(`The changelog has text in ${release.version} outside any section.`);
    lines = [];
  };

  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('# ')) continue;
    if (line.startsWith('## ')) {
      closeSection();
      const match = line.match(RELEASE);
      if (!match) throw new Error(`The changelog has a release heading it cannot read: "${line}".`);
      const [, linked, compareUrl, plain, date] = match;
      release = { version: linked ?? plain, date, compareUrl, sections: [] };
      section = undefined;
      releases.push(release);
      continue;
    }
    const heading = line.match(SECTION);
    if (heading && release) {
      closeSection();
      const breaking = heading[1] === BREAKING;
      section = { title: breaking ? 'Breaking changes' : heading[1], breaking, markdown: '' };
      release.sections.push(section);
      continue;
    }
    (release ? lines : note).push(line);
  }
  closeSection();
  // Breaking changes lead their release, as release-please writes them; kept
  // first even if a hand edit moves them.
  for (const { sections } of releases) sections.sort((a, b) => Number(b.breaking) - Number(a.breaking));

  return { note: keepNames(note.join('\n').trim()), releases: releases.sort(byVersionDescending) };
};
