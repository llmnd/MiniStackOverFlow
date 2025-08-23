export const DOMAINS = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'React',
  'Node.js',
  'Database',
  'DevOps',
  'Mobile',
  'Other'
] as const;

export type Domain = typeof DOMAINS[number];
