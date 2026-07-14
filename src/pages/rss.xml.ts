import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getChangelog } from '../lib/data';
import { SITE } from '../lib/site';

export async function GET(context: APIContext) {
  const entries = getChangelog().entries;

  return rss({
    title: `${SITE.name} — what changed`,
    description: 'Verified updates to rebate, FiT and cost data on Aussies R Us.',
    site: context.site ?? SITE.url,
    items: entries.map((entry) => ({
      title: entry.summary.slice(0, 120) + (entry.summary.length > 120 ? '…' : ''),
      description: `${entry.summary} Affected: ${entry.affectedPages.join(', ')}`,
      pubDate: new Date(`${entry.date}T00:00:00Z`),
      // Unique per entry (matches id on /what-changed/) so feed GUIDs never collide.
      link: `/what-changed/#e-${entry.date}`,
    })),
  });
}
