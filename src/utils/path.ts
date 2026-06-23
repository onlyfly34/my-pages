/**
 * 把站內路徑接上部署用的 base 子路徑。
 *
 * 子路徑部署（模式 B，例如 /my-pages/）時，所有站內連結與資源都必須帶 base，
 * 否則會破圖 / 連到根網域。**禁止**在元件裡寫死 `/...` 絕對路徑，一律用這個 helper。
 *
 *   withBase('/posts/foo')  ->  '/my-pages/posts/foo'   （模式 B）
 *   withBase('/posts/foo')  ->  '/posts/foo'            （模式 A）
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}

/** 文章 slug 對應的網址。 */
export function postPath(slug: string): string {
  return withBase(`/posts/${slug}/`);
}

/** 標籤聚合頁網址。 */
export function tagPath(tag: string): string {
  return withBase(`/tags/${encodeURIComponent(tag)}/`);
}
