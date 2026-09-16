/**
 * Collapses a surface form down to letters and digits only, so spacing and
 * punctuation variants of the same term collide into one lookup key —
 * "React.js", "React JS", and "ReactJS" all become "reactjs" — while the
 * dictionaries that consume this key remain free to map that key back to
 * whatever canonical spelling is correct ("react", not "reactjs").
 */
export function toLookupKey(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}
