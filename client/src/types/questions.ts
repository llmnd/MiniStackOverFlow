export interface Question {
  id: number;
  title: string;
  content: string;
  domain: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  name: string;
}

export type DomainType = typeof DOMAINS[number];

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
  'Web',
  'Security',
  'Other'
] as const;
