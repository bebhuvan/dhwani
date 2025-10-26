import { getCollection } from 'astro:content';
import { normalizeAuthorNames } from '../utils/authorUtils';

export async function GET() {
  const allWorks = await getCollection('works');

  // Create lightweight search data
  const searchData = allWorks.map(work => ({
    slug: work.slug,
    title: work.data.title,
    author: work.data.author,
    authorNormalized: normalizeAuthorNames(work.data.author),
    description: work.data.description,
    language: work.data.language,
    genre: work.data.genre,
    year: work.data.year || null,
  }));

  return new Response(JSON.stringify(searchData), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
