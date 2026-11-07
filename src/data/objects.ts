// Typed views of an object's keys. Object.keys and Object.entries type every key
// as string, because an object may carry more keys than its type names. The
// core's palette is a closed record, so its keys are exactly its key type
// (FlavorId, PigmentId, FontRole...). These are the only casts that say so.

/** The keys of a closed record, typed as its key type. */
export const keysOf = <T extends object>(record: T) => Object.keys(record) as (keyof T & string)[];

/** The entries of a closed record, typed as its key and value types. */
export const entriesOf = <T extends object>(record: T) => Object.entries(record) as [keyof T & string, T[keyof T]][];

/**
 * The value under a key that comes from outside the type, such as text read
 * from a page: undefined when the record has no such key.
 */
export const lookup = <T extends object>(record: T, key: string): T[keyof T] | undefined =>
  Object.hasOwn(record, key) ? record[key as keyof T] : undefined;

/** A record with the same keys, each value mapped. Object.fromEntries forgets the keys. */
export const mapValues = <T extends object, V>(record: T, map: (value: T[keyof T], key: keyof T & string) => V) =>
  Object.fromEntries(entriesOf(record).map(([key, value]) => [key, map(value, key)])) as Record<keyof T & string, V>;
