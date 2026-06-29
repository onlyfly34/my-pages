/**
 * 全站設定的單一來源（Single Source of Truth）。
 *
 * 你幾乎只需要改這個檔案就能把整個站搬到自己的帳號 / 倉庫底下：
 *   - username / repo 會推導出部署網址與子路徑（base）
 *   - astro.config.mjs 會從這裡讀取 site / base，不要在別處重複寫死
 *
 * 兩種部署模式（詳見 README）：
 *   - 'project'（預設）：任意倉庫名，網址為 https://<username>.github.io/<repo>/
 *   - 'user'：倉庫名必須是 <username>.github.io，網址為 https://<username>.github.io/
 */
export const SITE = {
  /** 站名（瀏覽器標題、頁首、RSS） */
  title: 'Take my notes',
  /** 站點簡述（首頁、SEO、RSS） */
  description: '整理系統、韌體與底層工程的技術筆記。把讀過、踩過、想通的東西，一篇一篇寫清楚。',
  /** 作者名（footer、RSS、文章預設作者） */
  author: 'Sky.Huang',
  /** GitHub 使用者名稱 —— 影響部署網址 */
  username: 'onlyfly34',
  /** 倉庫名 —— 在 'project' 模式下影響 base 子路徑 */
  repo: 'my-pages',
  /** 部署模式：'project'（子路徑）或 'user'（根網域） */
  mode: 'project' as 'project' | 'user',
  /** 介面語言 */
  lang: 'zh-Hant-TW',
  /** OG locale */
  locale: 'zh_TW',
  /** 每頁文章列表上限 */
  postsPerPage: 10,
  /** 社群 / 外部連結 */
  links: {
    github: 'https://github.com/onlyfly34',
  },
} as const;

/** 部署根網址（不含子路徑），astro.config 的 `site` 由此而來。 */
export const SITE_URL = `https://${SITE.username}.github.io`;

/** 部署子路徑，astro.config 的 `base` 由此而來。 */
export const BASE_PATH = SITE.mode === 'project' ? `/${SITE.repo}` : '/';
