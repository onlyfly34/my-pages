import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 取得已發佈文章（production 下濾掉 drage），依日期新到舊排序。 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true,
  );
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 統計所有標籤與其文章數，依數量多到少排序。 */
export function getAllTags(posts: Post[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 日期格式化（zh-Hant）。 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-Hant', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** ISO 短日期（給 <time datetime>）。 */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
