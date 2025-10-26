import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const works = await getCollection('works');
  const sortedWorks = works.sort((a, b) => {
    return b.data.publishDate.valueOf() - a.data.publishDate.valueOf();
  });

  return rss({
    title: 'Dhwani - Indian Literary Treasures',
    description: 'Discover India\'s literary treasures - from ancient Vedic hymns to Tagore\'s poetry, thousands of works that shaped hearts and minds across centuries.',
    site: context.site,
    items: sortedWorks.map((work) => ({
      title: work.data.title,
      pubDate: work.data.publishDate,
      description: work.data.description,
      author: work.data.author.join(', '),
      link: `/works/${work.slug}/`,
      categories: work.data.genre,
    })),
    customData: `<language>en-us</language>`,
  });
}