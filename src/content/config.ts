import { defineCollection, z } from 'astro:content';

const works = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.array(z.string()),
    year: z.number().optional(),
    language: z.array(z.string()),
    genre: z.array(z.string()),
    description: z.string(),
    collections: z.array(z.enum([
      'academic-journals',
      'ancient-history',
      'ancient-wisdom',
      'archaeology',
      'archival-sources',
      'arts-texts',
      'astronomy',
      'buddhist-texts',
      'classical-literature',
      'colonial-india',
      'comparative-religion',
      'court-chronicles',
      'devotional-literature',
      'devotional-poetry',
      'epigraphy',
      'epic-poetry',
      'ethnographic-studies',
      'ethnography',
      'folklore',
      'folklore-collection',
      'genealogy',
      'historical-literature',
      'historical-texts',
      'indology',
      'jain-literature',
      'jain-texts',
      'legal-texts',
      'linguistic-works',
      'mathematics',
      'medical-texts',
      'medieval-india',
      'modern-literature',
      'mughal-history',
      'mughal-india',
      'musicology',
      'numismatics',
      'oral-literature',
      'pali-literature',
      'philosophical-works',
      'philosophy',
      'poetry-collection',
      'political-philosophy',
      'reference-texts',
      'reference-works',
      'regional-history',
      'regional-literature',
      'regional-voices',
      'religious-texts',
      'ritual-texts',
      'sanskrit-drama',
      'scholarly-translations',
      'science',
      'scientific-texts',
      'scientific-works',
      'spiritual-texts',
      'technical-manuals',
      'tribal-studies',
    ])).default([]),
    sources: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.enum(['gutenberg', 'archive', 'sacred', 'other']),
    })),
    references: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.enum(['wikipedia', 'wikisource', 'openlibrary', 'other']),
    })).default([]),
    featured: z.boolean().default(false),
    publishDate: z.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const authors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    birth: z.number().optional(),
    death: z.number().optional(),
    languages: z.array(z.string()),
    bio: z.string(),
    image: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string().default('Editorial Team'),
    category: z.enum(['author-spotlight', 'new-discovery', 'literary-analysis', 'digital-preservation', 'community']),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    image: z.string().optional(),
  }),
});

export const collections = {
  works,
  authors,
  blog,
};

// Export types for use in utilities
export type WorkSchema = z.infer<typeof works.schema>;
export type AuthorSchema = z.infer<typeof authors.schema>;
export type BlogSchema = z.infer<typeof blog.schema>;