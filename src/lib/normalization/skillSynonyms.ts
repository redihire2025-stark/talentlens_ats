export interface SynonymGroup {
  /** The canonical spelling every variant below normalizes to. */
  canonical: string
  /** Every known surface form, including the canonical spelling itself. */
  variants: string[]
}

/**
 * Bumped whenever `SKILL_SYNONYM_GROUPS` changes in a way that could change
 * a canonicalization result — recorded on every parsed Resume
 * (`parserMetadata.taxonomyVersion`) so a stored result can be traced back
 * to the taxonomy that produced it (spec §4/§12: "versioned taxonomy").
 */
export const SKILL_TAXONOMY_VERSION = '1.0.0'

/**
 * Seed data for skill canonicalization. Deliberately a plain data array,
 * not scattered `if` statements — adding a new skill or variant means
 * adding one entry here, not touching any matching/scoring code (see
 * "ARCHITECTURAL PRINCIPLE" / "Do not hardcode matching logic throughout
 * the application" in AGENTS.md). Not exhaustive; extend as real resumes
 * and job descriptions surface gaps.
 */
export const SKILL_SYNONYM_GROUPS: SynonymGroup[] = [
  { canonical: 'react', variants: ['react', 'react.js', 'reactjs', 'react js'] },
  { canonical: 'next.js', variants: ['next', 'next.js', 'nextjs', 'next js'] },
  { canonical: 'vue.js', variants: ['vue', 'vue.js', 'vuejs', 'vue js'] },
  { canonical: 'angular', variants: ['angular', 'angularjs', 'angular.js', 'angular js'] },
  { canonical: 'node.js', variants: ['node', 'node.js', 'nodejs', 'node js'] },
  { canonical: 'javascript', variants: ['javascript', 'js', 'java script', 'ecmascript'] },
  { canonical: 'typescript', variants: ['typescript', 'ts', 'type script'] },
  { canonical: 'python', variants: ['python', 'python3', 'python 3'] },
  { canonical: 'java', variants: ['java'] },
  { canonical: 'c#', variants: ['c#', 'csharp', 'c sharp'] },
  { canonical: 'c++', variants: ['c++', 'cpp', 'c plus plus'] },
  { canonical: 'go', variants: ['go', 'golang'] },
  { canonical: 'html', variants: ['html', 'html5'] },
  { canonical: 'css', variants: ['css', 'css3'] },
  { canonical: 'sql', variants: ['sql'] },
  { canonical: 'graphql', variants: ['graphql', 'graph ql'] },
  { canonical: 'rest api', variants: ['rest api', 'restful api', 'rest apis', 'restful apis', 'rest'] },
  { canonical: 'postgresql', variants: ['postgres', 'postgresql', 'postgre sql'] },
  { canonical: 'mysql', variants: ['mysql', 'my sql'] },
  { canonical: 'mongodb', variants: ['mongodb', 'mongo db', 'mongo'] },
  { canonical: 'redis', variants: ['redis'] },
  { canonical: 'aws', variants: ['aws', 'amazon web services'] },
  { canonical: 'azure', variants: ['azure', 'microsoft azure'] },
  { canonical: 'gcp', variants: ['gcp', 'google cloud platform', 'google cloud'] },
  { canonical: 'docker', variants: ['docker'] },
  { canonical: 'kubernetes', variants: ['kubernetes', 'k8s'] },
  { canonical: 'ci/cd', variants: ['ci/cd', 'cicd', 'ci cd', 'continuous integration continuous deployment'] },
  { canonical: 'git', variants: ['git'] },
]
